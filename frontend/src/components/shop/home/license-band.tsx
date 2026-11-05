import { HeartHandshake } from "lucide-react";

export function LicenseBand() {
  return (
    <section
      aria-labelledby="license-title"
      className="bg-(--sh-band-green) px-4 py-16 text-center text-white md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <HeartHandshake className="mx-auto size-14 text-white/90" aria-hidden="true" />
        <h2
          id="license-title"
          className="font-display mt-6 text-2xl font-bold tracking-tight text-white md:text-4xl"
        >
          Cấp phép an tâm
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
          Mọi LUT trên DownBeat đều là sản phẩm gốc, do người thật tạo ra và được cấp phép đầy đủ, để bạn yên tâm đăng tải ở bất cứ đâu.
        </p>
        <p className="mt-6 text-base font-bold text-white md:text-lg">
          Không khiếu nại bản quyền. Không rủi ro pháp lý.
        </p>
      </div>
    </section>
  );
}
