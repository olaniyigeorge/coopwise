from datetime import datetime

BRAND = {
    "ink": "#0B211F",
    "teal_900": "#06413F",
    "teal_900_deep": "#052F2D",
    "teal_700": "#096157",
    "gold_500": "#C08A2E",
    "gold_100": "#F1E4C7",
    "paper": "#F6F3EC",
    "paper_dim": "#ECE7DB",
    "line": "#D9D2BF",
    "white": "#FFFFFF",
}

FONT_HEADING = "'Poppins', Arial, sans-serif"
FONT_BODY = "'Inter', Arial, sans-serif"
FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace"

# TODO: replace with a hosted PNG (not the relative /static/ path — email
# clients can't resolve that). e.g. your Vercel-deployed frontend's public asset.
LOGO_URL = "https://olaniyigeorge.com/assets/images/coopwise-logo.png"

# Diagonal hairline stripe + gold glow, matching the docs header. Renders in
# Apple Mail / Gmail (web + app) / Yahoo; Outlook desktop falls back to the
# solid teal_900_deep background-color set alongside it — acceptable
# degradation for a texture accent.
HEADER_BG_STYLE = (
    f"background-color:{BRAND['teal_900_deep']}; "
    f"background-image: radial-gradient(circle at 15% -10%, rgba(192,138,46,0.35), transparent 60%), "
    f"repeating-linear-gradient(135deg, rgba(241,228,199,0.06) 0px, rgba(241,228,199,0.06) 1px, transparent 1px, transparent 14px), "
    f"linear-gradient(160deg, {BRAND['teal_900']} 0%, {BRAND['teal_900_deep']} 100%);"
)


def render_email_base(*, preheader: str, body_html: str) -> str:
    """Wraps domain-specific body_html in the CoopWise branded shell.
    Table-based layout — email clients don't reliably support flexbox/
    grid, so this mirrors the site's visual tokens (gradient glow, stripe
    texture, gold accents, mono eyebrow) rather than its literal CSS."""
    b = BRAND
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CoopWise</title>
</head>
<body style="margin:0; padding:0; background-color:{b['paper']};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">{preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{b['paper']};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <!-- Header: gradient glow + stripe texture, matching docs header -->
          <tr>
            <td style="{HEADER_BG_STYLE} border-radius:14px 14px 0 0; padding: 36px 24px 32px; text-align:center;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(145deg, {b['gold_500']}, #8F6417); border-radius:9px; width:38px; height:38px; text-align:center; vertical-align:middle;">
                    <img src="{LOGO_URL}" alt="CoopWise" width="26" height="26" style="display:block; margin:6px auto; border-radius:4px;">
                  </td>
                  <td style="padding-left:10px;">
                    <span style="font-family:{FONT_MONO}; color:{b['gold_100']}; font-size:13px; letter-spacing:2.5px; text-transform:uppercase;">CoopWise</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body slot -->
          <tr>
            <td style="background-color:{b['white']}; padding: 40px 32px; border-left:1px solid {b['line']}; border-right:1px solid {b['line']}; font-family:{FONT_BODY};">
              {body_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:{b['teal_900']}; border-radius:0 0 14px 14px; padding: 20px 24px; text-align:center;">
              <span style="font-family:{FONT_MONO}; color:{b['gold_100']}; font-size:11px; letter-spacing:1px;">
                &copy; {datetime.now().year} CoopWise &middot; Trust infrastructure for African savings groups
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
