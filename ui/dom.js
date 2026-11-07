export const createElement = (tag, props = {}, children = []) => {
    const e = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined) {
            continue;
        }
        if (key === 'text') {
            e.textContent = String(value);
        }
        else if (key === 'className') {
            e.className = String(value);
        }
        else if (key === 'onclick' && typeof value === 'function') {
            e.addEventListener('click', value);
        }
        else if (key === 'oninput' && typeof value === 'function') {
            e.addEventListener('input', value);
        }
        else if (key === 'onkeydown' && typeof value === 'function') {
            e.addEventListener('keydown', value);
        }
        else if (key === 'disabled') {
            e.disabled = Boolean(value);
        }
        else if (key === 'selected') {
            e.selected = Boolean(value);
        }
        else if (key === 'value') {
            e.value = String(value);
        }
        else {
            e.setAttribute(key, String(value));
        }
    }
    for (const c of children) {
        e.append(c);
    }
    return e;
};
export const clearChildren = (node) => {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
};
