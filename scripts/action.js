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
  const isDraft = github.context.payload.pull_request.draft;
  const isMerged = github.context.payload.pull_request.merged && github.context.payload.pull_request.state !== 'closed';
  const isClosed = github.context.payload.pull_request.state === 'closed' && !isMerged;

  console.log({isDraft, isMerged, isClosed, targetBranch})
  let newTicketStatus;
  if(isClosed) {
    newTicketStatus = 'OPEN'
  } else if(isDraft) {
    newTicketStatus = 'IN PROGRESS'
  } else if(isMerged && targetBranch === mainBranch) {
    newTicketStatus = 'QA'
  } else if(isMerged && targetBranch !== mainBranch) {
    newTicketStatus = 'DO NOTHING'
  } else {
    newTicketStatus = 'IN REVIEW'
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
