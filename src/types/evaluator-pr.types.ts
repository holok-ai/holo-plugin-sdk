export interface PRFile {
    sha: string;
    diff: string;
    patch: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    changes: number;
    filename: string;
    additions: number;
    deletions: number;
    raw_url: string;
    blob_url: string;
    contents_url: string;
}

export interface PrMetricSummary {
    source?: string;
    organization?: string;
    repository?: string;
    prid?: string;
    changedFiles: number;
    localAdditions: number;
    localDeletions: number;
    prAdditions: number;
    prDeletions: number;
    prAdditionsFromLocal: number;
    prDeletionsFromLocal: number;
    additionPercentage: number;
    deletionPercentage: number;
}

export interface FileComparisonDetail {
    filename: string;
    tool: string;
    localAdditions: number;
    localDeletions: number;
    foundAdditions: number;
    foundDeletions: number;
}

export interface ExtractedChanges {
    additions: Set<string>;
    deletions: Set<string>;
}

export interface UnifiedDiffBlock {
    language: string;
    tool: string;
    originalBlock: string;
    diffBlock: string;
    filePath: string;
    fileName: string;
}