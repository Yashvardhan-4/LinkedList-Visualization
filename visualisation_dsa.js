document.addEventListener('DOMContentLoaded', () => {
    const dom = {
        polyInputContainer: document.getElementById('polyInputContainer'),
        polyInputStep1: document.getElementById('polyInputStep1'),
        polyInputLabel: document.getElementById('polyInputLabel'),
        maxPowerInput: document.getElementById('maxPowerInput'),
        nextPolyStepBtn: document.getElementById('nextPolyStepBtn'),
        polyCoeffForm: document.getElementById('polyCoeffForm'),
        submitPolyBtn: document.getElementById('submitPolyBtn'),
        inputSummary: document.getElementById('input-summary'),
        opAddBtn: document.getElementById('opAddBtn'),
        opSubtractBtn: document.getElementById('opSubtractBtn'),
        opMultiplyBtn: document.getElementById('opMultiplyBtn'),
        playBtn: document.getElementById('playBtn'),
        pauseBtn: document.getElementById('pauseBtn'),
        nextBtn: document.getElementById('nextBtn'),
        resetBtn: document.getElementById('resetBtn'),
        speedRange: document.getElementById('speedRange'),
        poly1ListDiv: document.getElementById('poly1List'),
        poly2ListDiv: document.getElementById('poly2List'),
        resultListDiv: document.getElementById('resultList'),
        visualizationArea: document.getElementById('visualizationArea'),
        explanationBox: document.getElementById('explanationBox'),
        operationHeading: document.getElementById('operationHeading'),
        codeSnippetBox: document.getElementById('codeSnippetBox'),
        variableStateBox: document.getElementById('variableStateBox'),
        memoryPool: document.getElementById('memoryPool'),
        head1: document.getElementById('head1'),
        head2: document.getElementById('head2'),
        headResult: document.getElementById('headResult'),
    };

    const cppCodeSnippets = {
        NONE: `// C++ code will be highlighted here.`,
        ADD_SUB_START: [
            `struct Node { ... };`,
            `Node* operate(Node* p1, Node* p2) {`,
            `    Node* resultHead = nullptr;`,
            `    Node* current = nullptr;`,
        ],
        ADD_SUB_LOOP: [`    while (p1 != nullptr && p2 != nullptr) {`],
        COMPARE_POWER: [`        if (p1->power == p2->power) {`],
        ADD_EQUAL: [`            int sum = p1->coeff + p2->coeff;`, `            // ... create and append new node ...`, `            p1 = p1->next;`, `            p2 = p2->next;`],
        SUB_EQUAL: [`            int diff = p1->coeff - p2->coeff;`, `            // ... create and append new node ...`, `            p1 = p1->next;`, `            p2 = p2->next;`],
        P1_GREATER: [`        } else if (p1->power > p2->power) {`, `            // ... append node from p1 ...`, `            p1 = p1->next;`],
        P2_GREATER: [`        } else {`, `            // ... append node from p2 ...`, `            p2 = p2->next;`],
        SUB_P2_GREATER: [`        } else {`, `            // ... append NEGATED node from p2 ...`, `            p2 = p2->next;`],
        P1_REMAINDER: [`    while (p1 != nullptr) {`, `        // ... append node from p1 ...`, `        p1 = p1->next;`],
        P2_REMAINDER: [`    while (p2 != nullptr) {`, `        // ... append node from p2 ...`, `        p2 = p2->next;`],
        SUB_P2_REMAINDER: [`    while (p2 != nullptr) {`, `        // ... append NEGATED node from p2 ...`, `        p2 = p2->next;`],
        MULT_OUTER_LOOP: [`Node* multiply(Node* p1, Node* p2) { ...`, `    for (Node* t1 = p1; t1 != nullptr; t1 = t1->next) {`],
        MULT_INNER_LOOP: [`        for (Node* t2 = p2; t2 != nullptr; t2 = t2->next) {`],
        MULT_CALC: [`            int newCoeff = t1->coeff * t2->coeff;`, `            int newPower = t1->power + t2->power;`, `            // Add to intermediate list...`],
        MULT_COMBINE: [`    // After loops, combine like terms...`],
        END: [`    }`, `    return resultHead;`]
    };

    let state = { poly1: [], poly2: [], result: [], steps: [], currentStep: 0, isPlaying: false, animationSpeed: 1.5, currentPolyTarget: 1, currentOperationExecutor: null };

    const generateAddresses = (length, base = 100) => Array.from({ length }, (_, i) => `0x${base + i * 4}`);
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const logMessage = (message) => { dom.explanationBox.innerHTML = ''; const p = document.createElement("p"); p.textContent = `> ${message}`; dom.explanationBox.appendChild(p); };
    const clearLog = () => dom.explanationBox.innerHTML = "";
    
    function updateVariableState(vars) {
        dom.variableStateBox.innerHTML = '';
        for (const key in vars) {
            dom.variableStateBox.innerHTML += `<div><span class="key">${key}:</span><span class="value">${vars[key]}</span></div>`;
        }
    }

    function createNodeElement({ coef, power }, idx, listType, addresses) {
        const node = document.createElement('div');
        node.className = 'll-node';
        node.id = `${listType}-node-${idx}`;
        const nextAddr = listType.startsWith('result') ? 'NULL' : (addresses[idx + 1] ? addresses[idx + 1] : 'NULL');
        node.innerHTML = `<div class="ll-node-compartments"><div class="ll-compartment ll-coeff">Coeff<br>${coef}</div><div class="ll-compartment ll-power">Power<br>${power}</div><div class="ll-compartment ll-next">Next<br><span class="ll-next-addr">${nextAddr}</span></div></div><div class="ll-address">${addresses[idx]}</div>`;
        return node;
    }

    function createArrowElement() { const arrow = document.createElement('div'); arrow.className = 'll-arrow'; return arrow; }
    function createNullSymbol() { const nullEl = document.createElement('span'); nullEl.className = 'null-symbol'; nullEl.textContent = '⏚ NULL'; return nullEl; }
    function createPointer(id, text) { const ptr = document.createElement('div'); ptr.id = id; ptr.className = 'll-traversal-ptr'; ptr.textContent = text; ptr.style.opacity = '0'; dom.visualizationArea.appendChild(ptr); return ptr; }
    
    const p1Ptr = createPointer('p1-ptr', 'P1');
    const p2Ptr = createPointer('p2-ptr', 'P2');
    const resultPtr = createPointer('result-ptr', 'Result');

    async function movePointerToNode(ptr, node) {
        if (!node) { ptr.style.opacity = '0'; return; }
        ptr.style.opacity = '1';
        const areaRect = dom.visualizationArea.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        ptr.style.left = `${nodeRect.left - areaRect.left + nodeRect.width / 2 - ptr.offsetWidth / 2}px`;
        ptr.style.top = `${nodeRect.top - areaRect.top - 40}px`;
        await delay(300 / state.animationSpeed);
    }

    function generateSteps(operation) {
        state.steps = []; let p1 = 0, p2 = 0;
        state.steps.push({ action: 'start', p1, p2, commentary: "Start of function. Pointers p1 and p2 are set to the heads of the two lists.", codeId: 'ADD_SUB_START', line: 1 });
        
        while (p1 < state.poly1.length && p2 < state.poly2.length) {
            const node1 = state.poly1[p1], node2 = state.poly2[p2];
            state.steps.push({ action: 'highlight', p1, p2, commentary: "Comparing nodes pointed to by p1 and p2.", codeId: 'ADD_SUB_LOOP', line: 0, vars: { 'p1->power': node1.power, 'p2->power': node2.power } });
            
            if (node1.power === node2.power) {
                let res, codeId, opChar;
                if (operation === 'addition') { res = node1.coef + node2.coef; codeId = 'ADD_EQUAL'; opChar = '+'; } 
                else { res = node1.coef - node2.coef; codeId = 'SUB_EQUAL'; opChar = '-'; }
                state.steps.push({ action: 'add_node', from: 'merge', data: { coef: res, power: node1.power }, commentary: `Powers are equal. ${operation === 'addition' ? 'Adding' : 'Subtracting'} coefficients (${node1.coef} ${opChar} ${node2.coef} = ${res}).`, codeId, line: 0, vars: { 'result': res } });
                p1++; p2++;
            } else if (node1.power > node2.power) {
                state.steps.push({ action: 'add_node', from: 'p1', data: node1, commentary: `p1's power (${node1.power}) is greater. Copying node from p1.`, codeId: 'P1_GREATER', line: 0 });
                p1++;
            } else {
                const data = operation === 'addition' ? node2 : { ...node2, coef: -node2.coef };
                const commentary = operation === 'addition' ? `p2's power (${node2.power}) is greater. Copying node from p2.` : `p2's power (${node2.power}) is greater. Copying NEGATED node from p2.`;
                state.steps.push({ action: 'add_node', from: 'p2', data, commentary, codeId: operation === 'addition' ? 'P2_GREATER' : 'SUB_P2_GREATER', line: 0 });
                p2++;
            }
        }

        while (p1 < state.poly1.length) {
            state.steps.push({ action: 'highlight', p1, p2: -1, commentary: "List 2 is empty. Processing remainder of List 1.", codeId: 'P1_REMAINDER', line: 0 });
            state.steps.push({ action: 'add_node', from: 'p1', data: state.poly1[p1], commentary: `Copying remaining node ${state.poly1[p1].coef}x^${state.poly1[p1].power} from List 1.`, codeId: 'P1_REMAINDER', line: 1 });
            p1++;
        }

        while (p2 < state.poly2.length) {
            state.steps.push({ action: 'highlight', p1: -1, p2, commentary: "List 1 is empty. Processing remainder of List 2.", codeId: 'P2_REMAINDER', line: 0 });
            const node2 = state.poly2[p2];
            const data = operation === 'addition' ? node2 : { ...node2, coef: -node2.coef };
            const commentary = operation === 'addition' ? `Copying remaining node ${node2.coef}x^${node2.power} from List 2.` : `Copying remaining NEGATED node (${-node2.coef}x^${node2.power}) from List 2.`;
            state.steps.push({ action: 'add_node', from: 'p2', data, commentary, codeId: operation === 'addition' ? 'P2_REMAINDER' : 'SUB_P2_REMAINDER', line: 1 });
            p2++;
        }
        state.steps.push({ action: 'end', commentary: "Both lists processed. Operation complete.", codeId: 'END', line: 1 });
    }

    function generateMultiplicationSteps() {
        state.steps = []; let intermediate = [];
        state.steps.push({ action: 'start', commentary: "Starting multiplication.", codeId: 'MULT_OUTER_LOOP', line: 1 });
        for (let i = 0; i < state.poly1.length; i++) {
            const node1 = state.poly1[i];
            state.steps.push({ action: 'highlight', p1: i, p2: -1, commentary: `Outer loop: selecting term ${node1.coef}x^${node1.power} from Poly 1.`, codeId: 'MULT_OUTER_LOOP', line: 1 });
            for (let j = 0; j < state.poly2.length; j++) {
                const node2 = state.poly2[j];
                state.steps.push({ action: 'highlight', p1: i, p2: j, commentary: `Inner loop: multiplying by ${node2.coef}x^${node2.power} from Poly 2.`, codeId: 'MULT_INNER_LOOP', line: 0 });
                const newCoeff = node1.coef * node2.coef;
                const newPower = node1.power + node2.power;
                intermediate.push({ coef: newCoeff, power: newPower });
                state.steps.push({ action: 'show_intermediate', data: [...intermediate], commentary: `Result is ${newCoeff}x^${newPower}. Adding to intermediate list.`, codeId: 'MULT_CALC', line: 0, vars: { newCoeff, newPower } });
            }
        }
        intermediate.sort((a, b) => b.power - a.power);
        state.steps.push({ action: 'start_combine', commentary: "All products calculated. Now, combining like terms.", codeId: 'MULT_COMBINE', line: 1 });
        if (intermediate.length > 0) {
            let combined = [];
            for (const term of intermediate) {
                if (combined.length > 0 && combined[combined.length - 1].power === term.power) {
                    combined[combined.length - 1].coef += term.coef;
                    state.steps.push({ action: 'update_node', index: combined.length - 1, data: combined[combined.length - 1], commentary: `Term with power ${term.power} exists. Combining coefficients.`, codeId: 'MULT_COMBINE', line: 1 });
                } else {
                    combined.push({ ...term });
                    state.steps.push({ action: 'add_node', from: 'carry', data: term, commentary: `Adding new term ${term.coef}x^${term.power} to final result.`, codeId: 'MULT_COMBINE', line: 1 });
                }
            }
        }
        state.steps.push({ action: 'end', commentary: "Multiplication complete.", codeId: 'END', line: 1 });
    }

    async function executeStep(step) {
        if (step.commentary) logMessage(step.commentary);
        if (step.vars) updateVariableState(step.vars);
        if (step.codeId) {
            const codeLines = cppCodeSnippets[step.codeId];
            dom.codeSnippetBox.innerHTML = codeLines.map((line, idx) => `<span class="code-line ${idx === step.line ? 'active' : ''}">${line}</span>`).join('');
        }

        document.querySelectorAll('.ll-node.highlight').forEach(n => n.classList.remove('highlight'));
        await movePointerToNode(p1Ptr, document.getElementById(`poly1-node-${step.p1}`));
        await movePointerToNode(p2Ptr, document.getElementById(`poly2-node-${step.p2}`));
        await movePointerToNode(resultPtr, document.getElementById(`result-node-${state.result.length - 1}`));

        switch (step.action) {
            case 'highlight':
                document.getElementById(`poly1-node-${step.p1}`)?.classList.add('highlight');
                document.getElementById(`poly2-node-${step.p2}`)?.classList.add('highlight');
                break;
            case 'add_node':
                if (step.data.coef !== 0) {
                    const resultIdx = state.result.length;
                    const newNodeEl = createNodeElement(step.data, resultIdx, 'result', generateAddresses(resultIdx + 1, 300));
                    
                    const poolRect = dom.memoryPool.getBoundingClientRect();
                    const listRect = dom.resultListDiv.getBoundingClientRect();
                    newNodeEl.style.position = 'absolute';
                    newNodeEl.style.left = `${poolRect.left - listRect.left}px`;
                    newNodeEl.style.top = `${poolRect.top - listRect.top}px`;
                    dom.resultListDiv.appendChild(newNodeEl);

                    await new Promise(resolve => anime({ targets: newNodeEl, left: dom.resultListDiv.scrollWidth, top: 0, duration: 600 / state.animationSpeed, easing: 'easeOutQuad', complete: () => { newNodeEl.style.position = 'relative'; newNodeEl.style.left = ''; newNodeEl.style.top = ''; resolve(); }}));
                    
                    state.result.push(step.data);
                    if (resultIdx === 0) dom.resultListDiv.innerHTML = '';
                    if (resultIdx > 0) dom.resultListDiv.appendChild(createArrowElement());
                    dom.resultListDiv.appendChild(newNodeEl);
                    
                    if (resultIdx > 0) {
                        const prevNodeEl = document.getElementById(`result-node-${resultIdx - 1}`);
                        if (prevNodeEl) {
                            const newAddress = newNodeEl.querySelector('.ll-address').textContent;
                            prevNodeEl.querySelector('.ll-next-addr').textContent = newAddress;
                            anime({ targets: prevNodeEl.querySelector('.ll-next'), backgroundColor: ['#f59e42', '#64748b'], duration: 600 });
                        }
                    }
                } else {
                    logMessage("Resulting coefficient is 0. No node is created to save memory.");
                    await delay(600 / state.animationSpeed);
                }
                break;
            case 'update_node':
                const nodeToUpdate = document.getElementById(`result-node-${step.index}`);
                if (nodeToUpdate) {
                    nodeToUpdate.querySelector('.ll-coeff').innerHTML = `Coeff<br>${step.data.coef}`;
                    await new Promise(resolve => anime({ targets: nodeToUpdate, scale: [1.1, 1], duration: 400, complete: resolve }));
                }
                break;
            case 'show_intermediate':
                dom.resultListDiv.innerHTML = '<div class="list-title" style="width: 100%; text-align: left; margin-bottom: 0.5rem;">Intermediate Products:</div>';
                step.data.forEach((term, i) => { if (i > 0) dom.resultListDiv.appendChild(createArrowElement()); dom.resultListDiv.appendChild(createNodeElement(term, i, 'inter', generateAddresses(step.data.length, 500))); });
                break;
            case 'start_combine':
                state.result = []; dom.resultListDiv.innerHTML = '';
                break;
        }
    }

    function playAnimation() { if (state.isPlaying) return; state.isPlaying = true; updateControlButtons(); const nextAnim = async () => { if (!state.isPlaying || state.currentStep >= state.steps.length) { state.isPlaying = false; updateControlButtons(); return; } await state.currentOperationExecutor(state.steps[state.currentStep]); state.currentStep++; setTimeout(nextAnim, 900 / state.animationSpeed); }; nextAnim(); }
    function pauseAnimation() { state.isPlaying = false; updateControlButtons(); }
    async function nextStep() { if (state.isPlaying || state.currentStep >= state.steps.length) return; dom.nextBtn.disabled = true; try { await state.currentOperationExecutor(state.steps[state.currentStep]); state.currentStep++; } finally { updateControlButtons(); } }

    const resetVisualization = (fullReset = false) => {
        pauseAnimation();
        ['poly1ListDiv', 'poly2ListDiv', 'resultListDiv'].forEach(key => { if (dom[key]) dom[key].innerHTML = ''; });
        movePointerToNode(p1Ptr, null); movePointerToNode(p2Ptr, null); movePointerToNode(resultPtr, null);
        if (fullReset) {
            state.poly1 = []; state.poly2 = []; state.currentPolyTarget = 1;
            dom.polyInputContainer.style.display = 'block'; dom.inputSummary.style.display = 'none'; dom.polyInputStep1.style.display = 'block';
            dom.polyCoeffForm.style.display = 'none'; dom.submitPolyBtn.style.display = 'none';
            updatePolyInputPrompt();
        }
        state.result = []; state.steps = []; state.currentStep = 0;
        updateControlButtons(true);
        document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active'));
        clearLog(); dom.codeSnippetBox.textContent = cppCodeSnippets.NONE; updateVariableState({});
        showInitialLists();
    };
    
    const updateControlButtons = (forceDisable = false) => {
        const opButtonsDisabled = forceDisable || (state.poly1.length === 0 && state.poly2.length === 0);
        document.querySelectorAll('.op-btn').forEach(btn => btn.disabled = opButtonsDisabled);
        const controlsDisabled = forceDisable || state.steps.length === 0;
        dom.playBtn.disabled = controlsDisabled || state.isPlaying;
        dom.pauseBtn.disabled = controlsDisabled || !state.isPlaying;
        dom.nextBtn.disabled = controlsDisabled || state.isPlaying || state.currentStep >= state.steps.length;
    };
    
    function showInitialLists() {
        [1, 2].forEach(num => {
            const listDiv = dom[`poly${num}ListDiv`], polyArr = state[`poly${num}`];
            listDiv.innerHTML = '';
            const addresses = generateAddresses(polyArr.length, num === 1 ? 100 : 200);
            polyArr.forEach((term, i) => { if (i > 0) listDiv.appendChild(createArrowElement()); listDiv.appendChild(createNodeElement(term, i, `poly${num}`, addresses)); });
            if (polyArr.length === 0) listDiv.appendChild(createNullSymbol());
        });
        dom.resultListDiv.innerHTML = ''; dom.resultListDiv.appendChild(createNullSymbol());
    }

    function updatePolyInputPrompt() { const polyNumText = state.currentPolyTarget === 1 ? "One" : "Two"; dom.polyInputLabel.textContent = `Enter Max Power of Polynomial ${polyNumText}:`; dom.submitPolyBtn.textContent = `Submit Polynomial ${polyNumText}`; dom.maxPowerInput.value = ''; dom.maxPowerInput.focus(); }
    dom.nextPolyStepBtn.onclick = () => { const maxPower = parseInt(dom.maxPowerInput.value); if (isNaN(maxPower) || maxPower < -1) { alert("Please enter a valid power (>= -1 for empty list)."); return; } dom.polyCoeffForm.innerHTML = ''; for (let p = maxPower; p >= 0; p--) { dom.polyCoeffForm.innerHTML += `<div><label>Coef of x^${p}: <input type="number" name="coeff_${p}" step="any" value="0"></label></div>`; } dom.polyInputStep1.style.display = 'none'; dom.polyCoeffForm.style.display = 'grid'; dom.submitPolyBtn.style.display = 'block'; };
    dom.submitPolyBtn.onclick = () => { const maxPower = parseInt(dom.maxPowerInput.value); let arr = []; for (let p = maxPower; p >= 0; p--) { const coef = Number(dom.polyCoeffForm.querySelector(`[name="coeff_${p}"]`).value) || 0; if (coef !== 0) arr.push({ coef, power: p }); } state[`poly${state.currentPolyTarget}`] = arr; if (state.currentPolyTarget === 1) { state.currentPolyTarget = 2; dom.polyInputStep1.style.display = 'block'; dom.polyCoeffForm.style.display = 'none'; dom.submitPolyBtn.style.display = 'none'; updatePolyInputPrompt(); } else { dom.polyInputContainer.style.display = 'none'; dom.inputSummary.style.display = 'block'; logMessage("Polynomials created. Choose an operation."); showInitialLists(); updateControlButtons(false); } };
    
    const startOperation = (opName, stepGenerator, stepExecutor) => { resetVisualization(); showInitialLists(); dom.operationHeading.textContent = `2. Performing: ${opName}`; state.currentOperationExecutor = stepExecutor; stepGenerator(opName.toLowerCase()); updateControlButtons(false); };
    
    dom.opAddBtn.addEventListener('click', function() { document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active')); this.classList.add('active'); startOperation('Addition', generateSteps, executeStep); });
    dom.opSubtractBtn.addEventListener('click', function() { document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active')); this.classList.add('active'); startOperation('Subtraction', generateSteps, executeStep); });
    dom.opMultiplyBtn.addEventListener('click', function() { document.querySelectorAll('.op-btn').forEach(btn => btn.classList.remove('active')); this.classList.add('active'); startOperation('Multiplication', generateMultiplicationSteps, executeStep); });
    
    dom.playBtn.onclick = playAnimation;
    dom.pauseBtn.onclick = pauseAnimation;
    dom.nextBtn.onclick = nextStep;
    dom.resetBtn.onclick = () => { resetVisualization(true); logMessage("System reset. Please enter polynomials."); };
    dom.speedRange.oninput = () => state.animationSpeed = Number(dom.speedRange.value);

    const initialize = () => { state.animationSpeed = dom.speedRange.value; resetVisualization(true); logMessage("Welcome! Please enter Polynomial One to begin."); };
    initialize();
});
