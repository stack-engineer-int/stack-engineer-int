export interface PRContext {
  title: string;
  body: string | null;
  diff: string;
  filesChanged: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
}
