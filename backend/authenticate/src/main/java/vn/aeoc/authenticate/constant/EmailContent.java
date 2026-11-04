package vn.aeoc.authenticate.constant;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class EmailContent {

    public static String buildForgotPasswordEmail(String name, String otp) {
        return """
        <html>
        <body style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
            <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:8px;padding:24px">
                <h2 style="color:#2f80ed">Khôi phục mật khẩu</h2>

                <p>Xin chào <b>%s</b>,</p>

                <p>
                    Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.
                </p>

                <div style="margin:20px 0;padding:16px;background:#f0f4ff;
                            text-align:center;font-size:24px;
                            font-weight:bold;letter-spacing:4px;
                            border-radius:6px;">
                    %s
                </div>

                <p>
                    Mã OTP có hiệu lực trong <b>5 phút</b>.
                    Vui lòng không chia sẻ mã này với bất kỳ ai.
                </p>

                <p style="margin-top:24px;color:#555">
                    Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.
                </p>

                <hr style="margin:24px 0">

                <p style="font-size:12px;color:#999">
                    © AEOC – Email tự động, vui lòng không trả lời
                </p>
            </div>
        </body>
        </html>
        """.formatted(name, otp);
    }


}
