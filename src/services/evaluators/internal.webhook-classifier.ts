import {AnalysisEventDTO, EvaluatorResult, MokuEvent} from '../../types';
import {InternalEvaluatorBase} from './internal.base';

class PullRequestInfo {
    organization: string;
    repository: string;
    pullRequestId: string;
    userEmail: string;

    constructor(organization = "", repository = "", pullRequestId = "", userEmail = "") {
        this.organization = organization;
        this.repository = repository;
        this.pullRequestId = pullRequestId;
        this.userEmail = userEmail;
    }
}

export class WebhookClassifier extends InternalEvaluatorBase {
    readonly evaluatorId = "";
    readonly handlesEventName = "webhook";
    readonly evaluatorName = "webhook-classifier";

    /**
     * Identifies the source platform of a webhook payload
     * @param payload - The webhook payload object
     * @returns "github", "azure", or "unknown"
     */
    private identifySource(payload: any): string {
        if (payload?.repository && payload?.sender) return "github";
        if (payload?.resource && payload?.resourceContainers) return "azure";
        return "unknown";
    }

    /**
     * Extracts GitHub webhook information
     * @param webhook - GitHub webhook payload
     * @returns Tuple of [webhookType, webhookState, PullRequestInfo]
     */
    private handleGit(webhook: any): [string, string, PullRequestInfo] {
        if (!webhook) return ["", "", new PullRequestInfo()];

        const action = webhook.action || "unknown";
        const webhookType = webhook.pull_request ? "pullrequest" : "unknown";
        const webhookState = webhook.pull_request && action !== "unknown" ? action : "";

        const organization = webhook.repository?.owner?.login || "";
        const repository = webhook.repository?.name || "";
        const pullRequestId = webhook.pull_request?.number?.toString() || "";
        const userEmail = webhook.sender?.email || webhook.sender?.login || webhook.pull_request?.user?.email || "";

        const data = new PullRequestInfo(organization, repository, pullRequestId, userEmail);
        return [webhookType, webhookState, data];
    }

    /**
     * Extracts Azure DevOps webhook information
     * @param webhook - Azure webhook payload
     * @returns Tuple of [webhookType, webhookState, PullRequestInfo]
     */
    private handleAzure(webhook: any): [string, string, PullRequestInfo] {
        if (!webhook) return ["", "", new PullRequestInfo()];

        const resource = webhook.resource || {};
        const webhookType = webhook.resource ? "pullrequest" : "unknown";
        const status = resource.status;
        const webhookState = status && status !== "unknown" ? status : "";

        const organization = webhook.resourceContainers?.account?.id || "";
        const repository = webhook.resourceContainers?.project?.id || "";
        const pullRequestId = resource.pullRequestId?.toString() || "";
        const userEmail = webhook.sender?.login || resource.createdBy?.uniqueName || "";

        const data = new PullRequestInfo(organization, repository, pullRequestId, userEmail);
        return [webhookType, webhookState, data];
    }

    /**
     * Handles unknown webhook sources
     * @returns Tuple with default values ["unknown", "", empty PullRequestInfo]
     */
    private handleUnknown(): [string, string, PullRequestInfo] {
        return ["unknown", "", new PullRequestInfo()];
    }

    /**
     * Evaluates a webhook event and classifies it
     * @param event - MokuEvent containing webhook data and analysis events in context
     * @returns EvaluatorResult with classification results and next events
     */
    async evaluate(event: MokuEvent): Promise<EvaluatorResult> {
        try {
            const analysisEvents: AnalysisEventDTO = event.context?.find(c => c.key === "analysis_events")?.value as AnalysisEventDTO;
            const webhook = analysisEvents.event_data;

            const source = webhook ? this.identifySource(webhook) : "unknown";

            let [webhookType, webhookState, extractedData] = source === "github"
                ? this.handleGit(webhook)
                : source === "azure"
                    ? this.handleAzure(webhook)
                    : this.handleUnknown();

            const eventName = source + "-" + webhookType + (webhookState ? `-${webhookState}` : "");

            // Look up user ID from email if available
            let userId = '';
            if (analysisEvents?.user_id) {
                // Extract the actual ID if user_id is an object with id property
                userId = typeof analysisEvents.user_id === 'object' && analysisEvents.user_id
                    ? analysisEvents.user_id
                    : analysisEvents.user_id.toString();
            }
            if (!userId && extractedData.userEmail) {
                const userIdFromEmail = await this.evaluatorDb.getUserIdByEmail(extractedData.userEmail);
                if (userIdFromEmail) {
                    userId = userIdFromEmail;
                }
            }

            const results: EvaluatorResult = {
                status: "ok",
                message: "",
                userId: userId,
                next_events: [],
                result: {key: "output", value: extractedData}
            };

            // if Add next_event
            if (webhookType && webhookType !== "unknown" && source !== "unknown" && eventName) {
                results.next_events = [{
                    source: "evaluator" as const,
                    eventName,
                    llmResponseDataId: '',
                    timestamp: Date.now()
                }];
            }

            return Promise.resolve(results);

        } catch (error) {
            return Promise.resolve({
                status: "error",
                message: error instanceof Error ? error.message : String(error),
                next_events: []
            });
        }
    }
}