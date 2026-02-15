import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Diagnostic endpoint: check DB connectivity and kill stuck connections
export async function GET() {
    const start = Date.now()
    try {
        // 1. Simple connectivity check
        const result = await Promise.race([
            prisma.$queryRawUnsafe<{ now: Date }[]>("SELECT NOW() as now"),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("DB query timed out after 10s")), 10_000)
            ),
        ])

        // 2. Check active connections
        const connections = await prisma.$queryRawUnsafe<
            { state: string; count: bigint }[]
        >(
            `SELECT state, COUNT(*) as count FROM pg_stat_activity 
       WHERE datname = 'postgres' GROUP BY state`
        )

        // 3. Check for long-running queries (>30s)
        const longQueries = await prisma.$queryRawUnsafe<
            { pid: number; state: string; duration: string; query: string; usename: string }[]
        >(
            `SELECT pid, state, usename,
              age(clock_timestamp(), query_start)::text as duration,
              LEFT(query, 100) as query
       FROM pg_stat_activity 
       WHERE datname = 'postgres' 
         AND state != 'idle'
         AND query_start < NOW() - INTERVAL '30 seconds'
       ORDER BY query_start`
        )

        const elapsed = Date.now() - start
        return NextResponse.json({
            status: "ok",
            latencyMs: elapsed,
            serverTime: result[0]?.now,
            connections: connections.map((c) => ({
                state: c.state,
                count: Number(c.count),
            })),
            longRunningQueries: longQueries.length,
            longQueries,
        })
    } catch (error) {
        const elapsed = Date.now() - start
        return NextResponse.json(
            {
                status: "error",
                latencyMs: elapsed,
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}

// POST: terminate idle-in-transaction connections to free up slots
export async function POST() {
    try {
        // Terminate only connections owned by our user (not superuser)
        const terminated = await prisma.$queryRawUnsafe<{ pid: number }[]>(
            `SELECT pg_terminate_backend(pid) as terminated, pid
       FROM pg_stat_activity 
       WHERE datname = 'postgres' 
         AND state = 'idle in transaction'
         AND pid != pg_backend_pid()
         AND usename = current_user`
        )

        // Also set a session-level idle-in-transaction timeout for THIS connection
        // to prevent future zombies (5 minutes)
        await prisma.$queryRawUnsafe(
            `SET idle_in_transaction_session_timeout = '300000'`
        )

        // Re-check after termination
        const connections = await prisma.$queryRawUnsafe<
            { state: string; count: bigint }[]
        >(
            `SELECT state, COUNT(*) as count FROM pg_stat_activity 
       WHERE datname = 'postgres' GROUP BY state`
        )

        return NextResponse.json({
            status: "ok",
            terminatedConnections: terminated.length,
            currentConnections: connections.map((c) => ({
                state: c.state,
                count: Number(c.count),
            })),
        })
    } catch (error) {
        return NextResponse.json(
            {
                status: "error",
                error: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
