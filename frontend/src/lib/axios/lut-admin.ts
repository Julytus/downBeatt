import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type {
  CreatorOptionDTO,
  LutAdminDetailDTO,
  LutAdminListApiRequest,
  LutAdminListResponseDTO,
  LutUploadKind,
  LutUpsertApiRequest
} from "@/lib/types/lut-admin";

/** GET /lut/list — VIEW (§5.1) */
export async function getLutAdminList(
  req: LutAdminListApiRequest = {}
): Promise<LutAdminListResponseDTO> {
  const params: Record<string, unknown> = {
    page: req.paging?.page ?? 1,
    limit: req.paging?.limit ?? 10
  };
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();
  if (req.status?.trim()) params.status = req.status.trim();
  if (req.style?.trim()) params.style = req.style.trim();

  const res = await axiosInstance.get<ApiResponse<LutAdminListResponseDTO>>("/lut/list", { params });
  return res.data.result;
}

/** GET /lut/get?id={id} — VIEW (§5.2) */
export async function getLutAdmin(id: number): Promise<LutAdminDetailDTO> {
  const res = await axiosInstance.get<ApiResponse<LutAdminDetailDTO>>("/lut/get", {
    params: { id }
  });
  return res.data.result;
}

/** POST /lut/update — ADD (không có id) / UPDATE (có id) (§5.3) */
export async function upsertLut(payload: LutUpsertApiRequest): Promise<LutAdminDetailDTO> {
  const res = await axiosInstance.post<ApiResponse<LutAdminDetailDTO>>("/lut/update", payload);
  return res.data.result;
}

/** POST /lut/delete/{id} — DELETE (§5.4) */
export async function deleteLut(id: number): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(`/lut/delete/${id}`);
  return res.data.result;
}

/** POST /lut/upload — UPDATE (multipart) (§5.5) */
export async function uploadLutFile(
  id: number,
  kind: LutUploadKind,
  file: File
): Promise<LutAdminDetailDTO> {
  const formData = new FormData();
  formData.append("id", String(id));
  formData.append("kind", kind);
  formData.append("file", file);

  const res = await axiosInstance.post<ApiResponse<LutAdminDetailDTO>>("/lut/upload", formData);
  return res.data.result;
}

/** POST /lut/publish/{id} — UPDATE (§5.6) */
export async function publishLut(id: number): Promise<LutAdminDetailDTO> {
  const res = await axiosInstance.post<ApiResponse<LutAdminDetailDTO>>(`/lut/publish/${id}`);
  return res.data.result;
}

/** POST /lut/hide/{id} — UPDATE (§5.7) */
export async function hideLut(id: number): Promise<LutAdminDetailDTO> {
  const res = await axiosInstance.post<ApiResponse<LutAdminDetailDTO>>(`/lut/hide/${id}`);
  return res.data.result;
}

/** GET /lut/creators — VIEW (§5.8) */
export async function getLutCreators(): Promise<CreatorOptionDTO[]> {
  const res = await axiosInstance.get<ApiResponse<CreatorOptionDTO[]>>("/lut/creators");
  return res.data.result;
}
