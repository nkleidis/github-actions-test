const github = require('@actions/github');
const core = require('@actions/core');

const mainBranch = 'main';

function getTitle() {
  return github.context.payload.pull_request.title;
}

async function run() {
  console.log("Retrieving PR title...")
  console.log(`PR title:: ${getTitle()}`);
  console.log(JSON.stringify(github.context.payload.pull_request))
  const targetBranch = github.context.payload.pull_request.base.ref;
  const isMerged = github.context.payload.pull_request.merged;
  const isClosed = github.context.payload.pull_request.state === 'closed';

  let newTicketStatus = 'IN PROGRESS';
  if (isClosed && !isMerged) {
    newTicketStatus = 'OPEN'
  } else if(targetBranch === mainBranch) {
    if(isMerged) {
      newTicketStatus = 'QA';
    } else {
      newTicketStatus = 'IN REVIEW';
    }
  }
  console.log('New tickets status:', newTicketStatus);
}

run().catch(e => core.setFailed(e));

/*
    Action  | Target  | New Status
    -------------------------------
    Open    | any     | IN REVIEW
    merged  | master  | QA
    merged  | other   | Do nothing
    closed  | any     | OPEN
    draft   | any     | IN PROGRESS
 */
