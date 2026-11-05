import { HeartHandshake } from "lucide-react";

export function LicenseBand() {
  return (
    <section
      aria-labelledby="license-title"
      className="bg-(--sh-band-green) px-4 py-16 text-center text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-4xl">
        <HeartHandshake className="mx-auto size-24 text-white md:size-32" strokeWidth={1.4} aria-hidden="true" />
        <h2
          id="license-title"
          className="font-display mt-8 text-3xl font-bold text-white md:text-[64px] md:leading-[1.1]"
        >
          Cấp phép an tâm
        </h2>
        <p className="mx-auto mt-6 max-w-[620px] text-base leading-relaxed text-white md:text-xl">
          Mọi LUT trên DownBeat đều là sản phẩm gốc, do người thật tạo ra và được cấp phép đầy đủ, để bạn yên tâm đăng tải ở bất cứ đâu.
        </p>
        <p className="mt-1 text-base font-bold text-white md:text-xl">
          Không khiếu nại bản quyền. Không rủi ro pháp lý.
        </p>
      </div>
    </section>
  );
}
