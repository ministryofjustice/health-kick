import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
   allowlist: {
    "node_modules/fsevents@^2.3.3": "FORBID",
    "node_modules/unrs-resolver@1.11.1": "ALLOW"
   },
})
