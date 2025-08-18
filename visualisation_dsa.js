// --- Utility Functions ---
function parsePolynomial(str) {
    // Normalize input
    str = str.replace(/\s+/g, '').replace(/X/g, 'x');
    // Replace x2, x3, etc. with x^2, x^3
    str = str.replace(/x(\d+)/g, 'x^$1');
    // Insert + before negative terms not at start
    str = str.replace(/([^\^])-/g, '$1+-');
    // Split into terms
    let terms = str.split(/(?=[+-])/);
    let arr = [];
    for (let term of terms) {
        if (!term) continue;
        let coef = 1, power = 0;
        // Match coefficient and power
        let match = term.match(/^([+-]?\d*)(x(\^(\d+))?)?$/);
        if (!match) throw new Error('Invalid polynomial format.');
        if (match[1] !== '') coef = Number(match[1]);
        else if (match[2]) coef = term[0] === '-' ? -1 : 1;
        if (match[2]) {
            power = match[4] ? Number(match[4]) : 1;
        }
        arr.push({ coef, power });
    }
    // Combine like powers
    let map = {};
    for (let t of arr) {
        if (map[t.power]) map[t.power] += t.coef;
        else map[t.power] = t.coef;
    }
    let result = [];
    for (let p in map) {
        if (map[p] !== 0) result.push({ coef: map[p], power: Number(p) });
    }
    result.sort((a, b) => b.power - a.power);
    return result;
}

// --- Linked List Node Creation ---
function createNodeElement({coef, power}, idx, listType, addresses) {
    const node = document.createElement('div');
    node.className = 'll-node';
    node.id = `${listType}-node-${idx}`;

    // Node address and next address
    const addr = addresses[idx];
    const nextAddr = addresses[idx+1] ? addresses[idx+1] : 'NULL';

    node.innerHTML = `
        <div class="ll-node-compartments">
            <div class="ll-compartment ll-coeff">Coeff<br>${coef}</div>
            <div class="ll-compartment ll-power">Power<br>${power}</div>
            <div class="ll-compartment ll-next">
                Next<br>
                <span class="ll-next-addr">${nextAddr}</span>
            </div>
        </div>
        <div class="ll-address">${addr}</div>
    `;
    return node;
}
function createArrowElement() {
    const arrow = document.createElement('div');
    arrow.className = 'll-arrow';
    return arrow;
}

// --- Animation Step Management ---
let steps = []; // Each step: {action, data}
let currentStep = 0;
let isPlaying = false;
let animationSpeed = 1;

// --- DOM Elements ---
const poly1Input = document.getElementById('poly1');
const poly2Input = document.getElementById('poly2');
const startBtn = document.getElementById('startBtn');
const poly1ListDiv = document.getElementById('poly1List');
const poly2ListDiv = document.getElementById('poly2List');
const resultListDiv = document.getElementById('resultList');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const speedRange = document.getElementById('speedRange');

// --- Linked List Data ---
let poly1Arr = [], poly2Arr = [], resultArr = [];

// --- Step Generation ---
function generateSteps() {
    steps = [];
    resultArr = [];
    // Step 1: Animate creation of Poly1 nodes
    for (let i = 0; i < poly1Arr.length; ++i) {
        steps.push({ action: 'createNode', data: { list: 'poly1', idx: i, node: poly1Arr[i] } });
    }
    // Step 2: Animate creation of Poly2 nodes
    for (let i = 0; i < poly2Arr.length; ++i) {
        steps.push({ action: 'createNode', data: { list: 'poly2', idx: i, node: poly2Arr[i] } });
    }
    // Step 3: Addition process
    let i = 0, j = 0;
    while (i < poly1Arr.length && j < poly2Arr.length) {
        steps.push({ action: 'highlight', data: { i, j } });
        if (poly1Arr[i].power === poly2Arr[j].power) {
            // Merge nodes
            let merged = { coef: poly1Arr[i].coef + poly2Arr[j].coef, power: poly1Arr[i].power };
            steps.push({ action: 'merge', data: { i, j, merged, idx: resultArr.length } });
            resultArr.push(merged);
            i++; j++;
        } else if (poly1Arr[i].power > poly2Arr[j].power) {
            // Carry poly1 node
            steps.push({ action: 'carry', data: { from: 'poly1', idx: i, node: poly1Arr[i], resultIdx: resultArr.length } });
            resultArr.push(poly1Arr[i]);
            i++;
        } else {
            // Carry poly2 node
            steps.push({ action: 'carry', data: { from: 'poly2', idx: j, node: poly2Arr[j], resultIdx: resultArr.length } });
            resultArr.push(poly2Arr[j]);
            j++;
        }
        steps.push({ action: 'unhighlight', data: { i: i-1, j: j-1 } });
    }
    // Remaining nodes
    while (i < poly1Arr.length) {
        steps.push({ action: 'carry', data: { from: 'poly1', idx: i, node: poly1Arr[i], resultIdx: resultArr.length } });
        resultArr.push(poly1Arr[i]);
        i++;
    }
    while (j < poly2Arr.length) {
        steps.push({ action: 'carry', data: { from: 'poly2', idx: j, node: poly2Arr[j], resultIdx: resultArr.length } });
        resultArr.push(poly2Arr[j]);
        j++;
    }
    
}

// --- Visualization Functions ---
function clearLists() {
    poly1ListDiv.innerHTML = '';
    poly2ListDiv.innerHTML = '';
    resultListDiv.innerHTML = '';
}
function resetVisualization() {
    isPlaying = false;
    currentStep = 0;
    resultArr = [];
    clearLists();
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    nextBtn.disabled = false;
}
function showInitialLists() {
    clearLists();
    // Poly1
    for (let i = 0; i < poly1Arr.length; ++i) {
        let node = createNodeElement(poly1Arr[i], i, 'poly1');
        poly1ListDiv.appendChild(node);
        if (i < poly1Arr.length - 1) poly1ListDiv.appendChild(createArrowElement());
    }
    // Poly2
    for (let i = 0; i < poly2Arr.length; ++i) {
        let node = createNodeElement(poly2Arr[i], i, 'poly2');
        poly2ListDiv.appendChild(node);
        if (i < poly2Arr.length - 1) poly2ListDiv.appendChild(createArrowElement());
    }
}

// --- Animation Step Execution ---
function executeStep(step) {
    switch (step.action) {
        case 'createNode': {
            let { list, idx, node } = step.data;
            let parentDiv = list === 'poly1' ? poly1ListDiv : list === 'poly2' ? poly2ListDiv : resultListDiv;
            let addresses;
            if (list === 'poly1') {
                addresses = generateAddresses(poly1Arr.length, 100);
            } else if (list === 'poly2') {
                addresses = generateAddresses(poly2Arr.length, 200);
            } else {
                addresses = generateAddresses(idx + 1, 300);
            }
            if (idx > 0) parentDiv.appendChild(createArrowElement());
            let nodeElem = createNodeElement(node, idx, list, addresses);
            parentDiv.appendChild(nodeElem);
            anime({
                targets: nodeElem,
                opacity: [0, 1],
                translateY: [-30, 0],
                duration: 600 / animationSpeed,
                easing: 'easeOutBack'
            });
            // Head pointer after first node
            if (idx === 0) createHeadPointer(list);
            break;
        }
        case 'highlight': {
            let { i, j } = step.data;
            let n1 = document.getElementById(`poly1-node-${i}`);
            let n2 = document.getElementById(`poly2-node-${j}`);
            if (n1) n1.classList.add('highlight');
            if (n2) n2.classList.add('highlight');
            break;
        }
        case 'unhighlight': {
            let { i, j } = step.data;
            let n1 = document.getElementById(`poly1-node-${i}`);
            let n2 = document.getElementById(`poly2-node-${j}`);
            if (n1) n1.classList.remove('highlight');
            if (n2) n2.classList.remove('highlight');
            break;
        }
        case 'merge': {
            let { i, j, merged, idx } = step.data;
            let n1 = document.getElementById(`poly1-node-${i}`);
            let n2 = document.getElementById(`poly2-node-${j}`);
            if (n1) n1.classList.add('merged');
            if (n2) n2.classList.add('merged');
            if (idx > 0) resultListDiv.appendChild(createArrowElement());
            // Generate addresses for result nodes up to idx+1
            let resultAddresses = generateAddresses(idx + 1, 300);
            let nodeElem = createNodeElement(merged, idx, 'result', resultAddresses);
            resultListDiv.appendChild(nodeElem);
            anime({
                targets: nodeElem,
                opacity: [0, 1],
                scale: [0.7, 1],
                duration: 600 / animationSpeed,
                easing: 'easeOutBack'
            });
            // Update head pointer for result list
            if (idx === 0) createHeadPointer('result');
            break;
        }
        case 'carry': {
            let { from, idx, node, resultIdx } = step.data;
            let n = document.getElementById(`${from}-node-${idx}`);
            if (n) n.classList.add('carry');
            if (resultIdx > 0) resultListDiv.appendChild(createArrowElement());
            // Generate addresses for result nodes up to resultIdx+1
            let resultAddresses = generateAddresses(resultIdx + 1, 300);
            let nodeElem = createNodeElement(node, resultIdx, 'result', resultAddresses);
            resultListDiv.appendChild(nodeElem);
            anime({
                targets: nodeElem,
                opacity: [0, 1],
                scale: [0.7, 1],
                duration: 600 / animationSpeed,
                easing: 'easeOutBack'
            });
            // Update head pointer for result list
            if (resultIdx === 0) createHeadPointer('result');
            break;
        }
    }
}

// --- Animation Control ---
function playAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    nextBtn.disabled = true;
    function nextAnim() {
        if (!isPlaying || currentStep >= steps.length) {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            nextBtn.disabled = false;
            isPlaying = false;
            return;
        }
        executeStep(steps[currentStep]);
        currentStep++;
        setTimeout(nextAnim, 700 / animationSpeed);
    }
    nextAnim();
}
function pauseAnimation() {
    isPlaying = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    nextBtn.disabled = false;
}
function nextStep() {
    if (currentStep < steps.length) {
        executeStep(steps[currentStep]);
        currentStep++;
    }
}
function resetAll() {
    resetVisualization();
    resultArr = [];
    poly1Arr = [];
    poly2Arr = [];
    steps = [];
}

// --- Event Listeners ---
playBtn.onclick = playAnimation;
pauseBtn.onclick = pauseAnimation;
nextBtn.onclick = nextStep;
resetBtn.onclick = resetAll;
speedRange.oninput = function() {
    animationSpeed = Number(speedRange.value);
};
startBtn.onclick = startVisualization;

// --- Input Handling ---
function startVisualization() {
    resetVisualization();
    let p1 = poly1Input.value.trim();
    let p2 = poly2Input.value.trim();
    if (!p1 || !p2) {
        alert('Please enter both polynomials.');
        return;
    }
    try {
        poly1Arr = parsePolynomial(p1);
        poly2Arr = parsePolynomial(p2);
    } catch (e) {
        alert('Invalid polynomial format.');
        return;
    }
    resultArr = [];
    generateSteps();
    clearLists(); // Only clear, do not showInitialLists
}

function generateAddresses(length, base=100) {
    let arr = [];
    for (let i = 0; i < length; ++i) {
        arr.push(`0x${base + i}`);
    }
    return arr;
}

function createHeadPointer(listType) {
    // Remove any existing head pointer
    const parentDiv = listType === 'poly1' ? poly1ListDiv : listType === 'poly2' ? poly2ListDiv : resultListDiv;
    const oldHead = parentDiv.querySelector('.ll-headptr');
    if (oldHead) oldHead.remove();

    const head = document.createElement('div');
    head.className = 'll-headptr';
    head.innerHTML = 'head';

    setTimeout(() => {
        const firstNode = parentDiv.querySelector(`#${listType}-node-0`);
        if (firstNode) {
            head.style.position = 'absolute';
            head.style.left = firstNode.offsetLeft + firstNode.offsetWidth/2 - 20 + 'px';
            head.style.top = firstNode.offsetTop - 35 + 'px';
            parentDiv.appendChild(head);
        }
    }, 50);
}

