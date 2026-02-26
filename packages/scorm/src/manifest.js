function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateScorm12Manifest({ courseSlug, unitSlug, title, files = [] }) {
  const identifier = `${courseSlug}-${unitSlug}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const itemId = `ITEM-${identifier}`;
  const resourceId = `RES-${identifier}`;
  const manifestId = `MANIFEST-${identifier}`;
  const safeTitle = xmlEscape(title || unitSlug);

  const allFiles = Array.from(new Set(["index.html", ...files])).filter(Boolean);
  const fileNodes = allFiles.map((href) => `      <file href="${xmlEscape(href)}" />`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${manifestId}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-${identifier}">
    <organization identifier="ORG-${identifier}">
      <title>${safeTitle}</title>
      <item identifier="${itemId}" identifierref="${resourceId}">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${resourceId}" type="webcontent" adlcp:scormtype="sco" href="index.html">
${fileNodes}
    </resource>
  </resources>
</manifest>`;
}
