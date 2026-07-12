import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { pollSpotify } from "./functions/poll-spotify/resource";

// The `allow.resource(pollSpotify)` rules in amplify/data/resource.ts grant
// poll-spotify's execution role IAM access to the relevant models — no
// manual CDK grants needed here.
defineBackend({
  data,
  pollSpotify,
});
