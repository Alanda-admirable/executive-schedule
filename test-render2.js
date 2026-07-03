const renderText = (text) => {
    let formatted = text;
    formatted = formatted.replace(/[ \t]+\(([^)]+)\)/g, '\u00A0($1)');
    return formatted.split('\n');
};
const res = renderText("ประจำปี 2569 \n(Queen's Cup Thailand Championship)");
console.log(JSON.stringify(res));
