import "dotenv/config"
import { createClient } from "@supabase/supabase-js"
import { Client } from "pg"

const BUCKET = "medical-recordings"
const LIST_LIMIT = 1000
const REMOVE_CHUNK_SIZE = 100

function joinPath(prefix, name) {
  return prefix ? `${prefix}/${name}` : name
}

async function listBucketPaths(supabase, prefix = "") {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: LIST_LIMIT,
    sortBy: { column: "name", order: "asc" },
  })

  if (error) {
    throw error
  }

  const files = []

  for (const item of data || []) {
    const nextPath = joinPath(prefix, item.name)

    if (item.id === null) {
      files.push(...(await listBucketPaths(supabase, nextPath)))
      continue
    }

    files.push(nextPath)
  }

  return files
}

async function removeBucketPaths(supabase, paths) {
  for (let index = 0; index < paths.length; index += REMOVE_CHUNK_SIZE) {
    const chunk = paths.slice(index, index + REMOVE_CHUNK_SIZE)
    const { error } = await supabase.storage.from(BUCKET).remove(chunk)

    if (error) {
      throw error
    }
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are missing")
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing")
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const client = new Client({ connectionString: process.env.DATABASE_URL })

  await client.connect()

  try {
    const [{ count: rowCount }] = (
      await client.query("select count(*)::int as count from recording_segments")
    ).rows

    const paths = await listBucketPaths(supabase)

    if (paths.length > 0) {
      await removeBucketPaths(supabase, paths)
    }

    await client.query("delete from recording_segments")

    console.log(
      JSON.stringify(
        {
          deletedRows: rowCount,
          deletedObjects: paths.length,
          bucket: BUCKET,
        },
        null,
        2
      )
    )
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
