from src.infra.emails.templates import render_email_base, BRAND, FONT_HEADING, FONT_MONO


def render_otp_email(*, code: str, expires_minutes: int = 10) -> tuple[str, str]:
    """Returns (subject, html) for the OTP verification email."""
    b = BRAND
    body_html = f"""
      <span style="font-family:{FONT_MONO}; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:{b['teal_700']}; display:block; margin-bottom:10px;">
        Secure Access
      </span>
      <h2 style="font-family:{FONT_HEADING}; margin:0 0 12px; font-size:21px; font-weight:700; color:{b['teal_900']};">
        Verify it's you
      </h2>
      <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:#2C3A38;">
        Enter this code to continue. It expires in {expires_minutes} minutes.
      </p>
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background-color:{b['paper_dim']}; border:1px solid {b['gold_500']}; border-radius:8px; padding:16px 32px;">
            <span style="font-family:{FONT_MONO}; font-size:28px; letter-spacing:8px; color:{b['teal_900']}; font-weight:600;">
              {code}
            </span>
          </td>
        </tr>
      </table>
      <p style="margin:0; font-size:12px; line-height:1.6; color:{b['teal_700']};">
        If you didn't request this code, you can safely ignore this email.
      </p>
    """
    subject = "Your CoopWise verification code"
    html = render_email_base(preheader=f"Your CoopWise code is {code}", body_html=body_html)
    return subject, html