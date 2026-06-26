import os

path = 'E:/demo/executive-schedule/src/app/admin/schedules/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace for the single row case
content = content.replace(
    "<td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit', verticalAlign: 'middle', overflowWrap: 'break-word', wordBreak: 'break-word' }}>\n                          <div style={{ color: exec.color",
    "<td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>\n                          <div style={{ color: exec.color"
)

# Replace for the rowSpan case
content = content.replace(
    "style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit', verticalAlign: 'middle', overflowWrap: 'break-word', wordBreak: 'break-word' }}\n                          >\n                          <div style={{ color: exec.color",
    "style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit', verticalAlign: 'middle', whiteSpace: 'nowrap' }}\n                          >\n                          <div style={{ color: exec.color"
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
