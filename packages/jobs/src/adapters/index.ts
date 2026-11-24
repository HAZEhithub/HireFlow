import type { AdapterResult, FetchLike, JobAdapterId } from "../types";
import { fetchAshbyBoard } from "./ashby";
import { fetchGreenhouseBoard } from "./greenhouse";
import { fetchLeverBoard } from "./lever";

export { fetchAshbyBoard, mapAshbyJob, ashbyBoardUrl } from "./ashby";
export { fetchGreenhouseBoard, mapGreenhouseJob, greenhouseBoardUrl } from "./greenhouse";
export { fetchLeverBoard, mapLeverJob, leverBoardUrl } from "./lever";

export async function fetchProviderBoard(
  adapter: Exclude<JobAdapterId, "user_import">,
  boardId: string,
  opts?: { fetch?: FetchLike; now?: Date; companyName?: string },
): Promise<AdapterResult> {
  if (adapter === "greenhouse") return fetchGreenhouseBoard(boardId, opts);
  if (adapter === "lever") return fetchLeverBoard(boardId, opts);
  return fetchAshbyBoard(boardId, opts);
}
