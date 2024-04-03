const github = require('@actions/github');
const core = require('@actions/core');

function getTitle() {
  return github.context.payload.pull_request.title;
}

async function run() {
  console.log("Retrieving PR title...")
  console.log(`PR title:: ${getTitle()}`);
  console.log(JSON.stringify(github.context.payload.pull_request))
}

run().catch(e => core.setFailed(e));