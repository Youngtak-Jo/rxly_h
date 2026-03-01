import shared from "./shared.json"
import landing from "./landing.json"
import auth from "./auth.json"
import consultation from "./consultation.json"
import admin from "./admin.json"
import dashboard from "./dashboard.json"
import errors from "./errors.json"
import exportMessages from "./export.json"
import tour from "./tour.json"

const messages = {
  ...shared,
  ...landing,
  ...auth,
  ...consultation,
  ...admin,
  ...dashboard,
  ...errors,
  ...exportMessages,
  ...tour,
} as const

export default messages
