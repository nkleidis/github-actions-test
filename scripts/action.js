const github = require('@actions/github');
const core = require('@actions/core');

function getTitle() {
  return github.context.payload.pull_request.title;
}

async function run() {
  core.debug(`PR title:: ${getTitle()}`);
}

run().catch(e => core.setFailed(e));