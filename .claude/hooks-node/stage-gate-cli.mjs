#!/usr/bin/env node
import{existsSync as h,mkdirSync as v,readFileSync as N,writeFileSync as E,mkdtempSync as x,rmSync as O}from"fs";import{resolve as S}from"path";import{tmpdir as k}from"os";import{spawnSync as u}from"child_process";var l=(c=>(c.REQUIREMENTS="requirements",c.ARCHITECTURE="architecture",c.PLAN="plan",c.ROOT_CAUSE="root-cause",c.ASSESSMENT="assessment",c.JUSTIFICATION="justification",c.IMPLEMENTATION="implementation",c.CRITIC_REVIEW="critic-review",c.DOCUMENTATION="documentation",c.COMPLETE="complete",c))(l||{});var d=class a{stateDir;stateFile;constructor(e=process.cwd()){this.stateDir=S(e,".claude","workflow-state"),this.stateFile=S(this.stateDir,"current-stage.json")}static detectWorkType(e){let t=e.toLowerCase();return t.includes("fix")||t.includes("bug")?"bugfix":t.includes("security")||t.includes("vuln")||t.includes("cve")?"security":t.includes("refactor")||t.includes("cleanup")?"refactor":t.includes("docs")||t.includes("documentation")?"docs":t.includes("chore")||t.includes("deps")||t.includes("build")?"chore":"feature"}static getRequiredGates(e){switch(e){case"feature":return["requirements","architecture","plan","implementation","critic-review","documentation","complete"];case"bugfix":return["root-cause","plan","implementation","critic-review","complete"];case"security":return["assessment","plan","implementation","critic-review","complete"];case"refactor":return["justification","plan","implementation","critic-review","complete"];case"docs":return["plan","implementation","complete"];case"chore":return["plan","implementation","complete"];default:return["plan","implementation","complete"]}}initialize(e,t){h(this.stateDir)||v(this.stateDir,{recursive:!0,mode:448});let r=u("git",["branch","--show-current"],{encoding:"utf-8"}).stdout?.trim()||"";if(["main","master","develop"].includes(r)&&!e)throw new Error(`Please create a feature branch before starting stage gates:
  git checkout -b feature/your-feature-name`);let o=t||a.detectWorkType(e||r),n=a.getRequiredGates(o)[0]||"plan",g={};Object.values(l).forEach(c=>{g[c]=null});let m={currentStage:n,completedStages:[],workType:o,featureBranch:r,startedAt:new Date().toISOString(),stageCommits:g};return this.saveState(m),m}getState(){if(!h(this.stateFile))return null;try{let e=N(this.stateFile,"utf-8");return JSON.parse(e)}catch(e){return console.error("Failed to read stage state:",e),null}}saveState(e){E(this.stateFile,JSON.stringify(e,null,2))}hasStageCommit(e){let t=this.getState();if(!t)return!1;let s=t.stageCommits[e];if(!s)return!1;let r=u("git",["cat-file","-t",s],{encoding:"utf-8"});return r.status===0&&r.stdout?.trim()==="commit"}completeStage(e,t){let s=this.getState();if(!s)throw new Error("No active workflow. Run initialize() first.");if(!(u("git",["status","--porcelain"],{encoding:"utf-8"}).stdout?.trim().length>0)&&e!=="requirements")return console.warn(`\u26A0\uFE0F  No changes to commit for stage: ${e}`),!1;let i=u("git",["add","."],{encoding:"utf-8"});if(i.status!==0)throw new Error(`Failed to stage changes: ${i.stderr}`);let n=x(S(k(),"stage-gate-")),g=S(n,"commit-msg.txt");try{E(g,t,{encoding:"utf-8",flag:"wx",mode:384});let p=u("git",["commit","--file",g],{encoding:"utf-8"});if(p.status!==0)throw new Error(`Failed to create commit: ${p.stderr}`)}finally{try{O(n,{recursive:!0,force:!0})}catch(p){console.warn("\u26A0\uFE0F  Failed to clean up temp directory:",p)}}let c=u("git",["rev-parse","HEAD"],{encoding:"utf-8"}).stdout?.trim();if(!c)throw new Error("Failed to get commit SHA");s.stageCommits[e]=c,s.lastCommitSha=c,s.completedStages.push(e);let f=Object.values(l),C=f.indexOf(e);return C<f.length-1&&(s.currentStage=f[C+1]),this.saveState(s),console.log(`\u2705 Stage ${e} completed with commit ${c.substring(0,7)}`),!0}enforceStageCommit(e){if(!this.getState())throw new Error("No active workflow. Please initialize stage tracking first.");let s=Object.values(l),r=s.indexOf(e);if(r===0)return;let o=s[r-1];if(!this.hasStageCommit(o))throw new Error(`\u274C Stage gate violation: ${o} must have a git commit before proceeding to ${e}.

Please complete the previous stage by creating a commit:
  git add .
  git commit -m "Gate: ${o}\\n\\n[summary]\\n\\n\u{1F512} Stage gate checkpoint"`)}clear(){h(this.stateFile)&&E(this.stateFile,"{}")}getCommitTemplate(e,t,s){let o=`${{requirements:"Gate 1: Requirements clarification",architecture:"Gate 2: Architecture design","root-cause":"Gate 1: Root cause analysis",assessment:"Gate 1: Security assessment",justification:"Gate 1: Refactoring justification",plan:"Implementation plan",implementation:"Implementation complete","critic-review":"Critic review approved",documentation:"Documentation updated",complete:"Work complete"}[e]}

${t}

\u{1F512} Stage gate checkpoint
Stage-Gate: ${e}`;return s!==void 0&&e==="critic-review"&&(o+=`
Review-Score: ${s}`,o+=`
Reviewed-By: critic@${new Date().toISOString()}`),o+=`
\u{1F916} Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`,o}};import{spawnSync as A}from"child_process";import{readFileSync as $,existsSync as M}from"fs";import{resolve as P}from"path";function T(a,e){let t=a.replace(/\\/g,"/");if(e){for(let[s,r]of Object.entries(e))if(R(t,r))return s}return/\.(md|txt)$/i.test(a)&&/(root-cause|analysis|investigation)/i.test(a)?"root-cause":/\.(md|txt)$/i.test(a)&&/(plan|roadmap|tasks)/i.test(a)?"plan":/\.(ts|js|tsx|jsx|py|java|go|rs|c|cpp|h)$/i.test(a)&&!/(test|spec)\.(ts|js|tsx|jsx|py)$/i.test(a)&&!/.claude\//.test(t)||/(test|spec)\.(ts|js|tsx|jsx|py|java|go)$/i.test(a)?"implementation":/README|CHANGELOG|docs\//i.test(a)||/\.(md)$/i.test(a)?"documentation":null}function y(a,e,t){if(e==="plan"&&/\.(md|txt)$/i.test(a)||e==="root-cause"&&/\.(md|txt)$/i.test(a)||e==="documentation"&&/\.(md|txt)$/i.test(a))return!0;if(e==="implementation"){let s=T(a,t);return s==="implementation"||s===null}return t&&t[e]?R(a.replace(/\\/g,"/"),t[e]):!1}function R(a,e){for(let t of e){let s=t.replace(/\*\*/g,"\xA7\xA7").replace(/\*/g,"[^/]*").replace(/§§/g,".*").replace(/\?/g,".");if(new RegExp(`^${s}$|/${s}$`).test(a))return!0}return!1}function I(a,e=process.cwd()){let t={valid:!0,declaredStage:null,violations:[],warnings:[],isBootstrap:!1,isNonStageCommit:!1};if(!a.includes("\u{1F512} Stage gate checkpoint"))return t.isNonStageCommit=!0,t;if(a.includes("[bootstrap]"))return t.isBootstrap=!0,t;let s=a.match(/^Gate:\s+(\S+)|Stage-Gate:\s+(\S+)/m),r=s?.[1]||s?.[2];if(!r)return t.valid=!1,t.warnings.push("Stage gate commit missing stage declaration"),t;t.declaredStage=r;let o=b(e);if(o.length===0)return t;let i=F(e);for(let n of o){if(n.includes(".claude/workflow-state/")||n.includes(".claude/review-state/"))continue;let g=T(n,i);g&&g!==r&&(y(n,r,i)||t.violations.push({file:n,expectedStage:g,declaredStage:r}))}return t.violations.length>0&&(t.valid=!1),t}function b(a){let e=A("git",["diff","--cached","--name-only"],{encoding:"utf-8",cwd:a});return e.status!==0?[]:e.stdout.trim().split(`
`).filter(Boolean)}function F(a){let e=P(a,".claude","settings.json");if(!M(e))return null;try{return JSON.parse($(e,"utf-8"))?.workflow?.stage_file_patterns||null}catch{return null}}function w(a){if(a.valid)return"";let e=["\u274C Stage gate validation failed",""];if(a.warnings.length>0&&e.push(...a.warnings,""),a.violations.length>0&&a.declaredStage){e.push(`Commit declares stage: "${a.declaredStage}"`),e.push("But includes files from other stages:","");for(let s of a.violations)e.push(`  - ${s.file} (belongs to: ${s.expectedStage})`);let t=a.violations[0];t&&(e.push("","Solutions:"),e.push(`  1. Move these files to a separate commit at the "${t.expectedStage}" stage`),e.push("  2. Change the stage declaration to match the files"),e.push("  3. Use the stage-gate CLI: node .claude/hooks-node/stage-gate-cli.mjs commit"))}return e.join(`
`)}function G(){console.log(`
Stage Gate CLI - Manage workflow stage gates

Usage:
  stage-gate init [feature-name] [--type=<work-type>]
  stage-gate status                  Show current stage and progress
  stage-gate commit <stage> <msg>    Create stage checkpoint commit
  stage-gate clear                   Clear workflow state
  stage-gate help                    Show this help

Work Types:
  feature     New functionality (default) - Full gates
  bugfix      Fix existing issue - Skip requirements/architecture
  security    Security vulnerability - Assessment gate required
  refactor    Code improvement - Justification gate required
  docs        Documentation only - Minimal gates
  chore       Build/tooling changes - Minimal gates

Stage Gates (vary by work type):
  requirements      Gate 1: Requirements clarification (feature)
  architecture      Gate 2: Architecture design (feature)
  root-cause        Gate 1: Root cause analysis (bugfix)
  assessment        Gate 1: Security assessment (security)
  justification     Gate 1: Refactoring justification (refactor)
  plan              Implementation plan (all types)
  implementation    Implementation complete (all types)
  critic-review     Critic review approved (feature/bugfix/security/refactor)
  documentation     Documentation updated (optional for bugfix/security)
  complete          Work complete (all types)

Examples:
  stage-gate init password-reset
  stage-gate init --type=bugfix auth-token-expiry
  stage-gate init --type=security xss-vulnerability
  stage-gate status
  stage-gate commit assessment "Identified XSS in user input rendering"
  stage-gate commit plan "Sanitize all user inputs with DOMPurify"
`)}async function L(){let a=process.argv.slice(2),e=a[0],t=process.env.CLAUDE_PROJECT_DIR||process.cwd(),s=new d(t);switch(e){case"init":{let r,o;for(let i=1;i<a.length;i++){let n=a[i];n?.startsWith("--type=")?o=n.substring(7):r||(r=n)}try{let i=s.initialize(r,o),n=d.getRequiredGates(i.workType);console.log("\u2705 Stage tracking initialized"),console.log(`\u{1F4E6} Work type: ${i.workType}`),console.log(`\u{1F4CD} Current stage: ${i.currentStage}`),console.log(`\u{1F33F} Branch: ${i.featureBranch}`),console.log(`\u{1F4C5} Started: ${i.startedAt}`),console.log(`
\u{1F4CB} Required gates for ${i.workType}:`),n.forEach((g,m)=>{console.log(`  ${m+1}. ${g}`)})}catch(i){throw i instanceof Error&&(console.error(`\u274C ${i.message}`),process.exit(1)),i}break}case"status":{let r=s.getState();r||(console.log("No active workflow. Run: stage-gate init [feature-name] [--type=<work-type>]"),process.exit(0)),console.log(`
\u{1F4CA} Stage Gate Status
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4E6} Work Type: ${r.workType}

\u{1F33F} Branch: ${r.featureBranch}
\u{1F4CD} Current stage: ${r.currentStage}
\u{1F4C5} Started: ${new Date(r.startedAt).toLocaleString()}

Stage Progress:
${U(r)}

Last commit: ${r.lastCommitSha?.substring(0,7)||"none"}
`);break}case"commit":{let r=a[1],o=a[2];(!r||!o)&&(console.error('\u274C Usage: stage-gate commit <stage> "<summary>"'),process.exit(1)),Object.values(l).includes(r)||(console.error(`\u274C Invalid stage: ${r}`),console.error(`   Valid stages: ${Object.values(l).join(", ")}`),process.exit(1));try{let i=s.getCommitTemplate(r,o),n=I(i,t);if(!n.valid){let g=w(n);console.error(g),process.exit(1)}s.completeStage(r,i)}catch(i){throw i instanceof Error&&(console.error(`\u274C ${i.message}`),process.exit(1)),i}break}case"clear":{s.clear(),console.log("\u2705 Workflow state cleared");break}case"help":case"--help":case"-h":G();break;default:console.error(`\u274C Unknown command: ${e}`),G(),process.exit(1)}}function U(a){return[{gate:"requirements",name:"Requirements"},{gate:"architecture",name:"Architecture"},{gate:"plan",name:"Plan"},{gate:"implementation",name:"Implementation"},{gate:"critic-review",name:"Critic Review"},{gate:"documentation",name:"Documentation"},{gate:"complete",name:"Complete"}].map(({gate:t,name:s})=>{let r=a.completedStages.includes(t),o=a.currentStage===t,i=a.stageCommits[t],n="\u2B1C";r&&i?n="\u2705":o?n="\u27A1\uFE0F ":r&&(n="\u26A0\uFE0F ");let g=i?`(${i.substring(0,7)})`:"";return`  ${n} ${s.padEnd(20)} ${g}`}).join(`
`)}L().catch(a=>{console.error("\u274C Unexpected error:",a),process.exit(1)});
