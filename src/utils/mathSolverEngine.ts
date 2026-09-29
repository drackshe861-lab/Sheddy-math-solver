// Built-in JSS Mathematical Solver Engine
// Serves as an immediate, reliable pedagogical solver when Gemini API is unavailable or returns 401

export interface SolverResult {
  extractedQuestion: string;
  finalAnswer: string;
  gradeLevel: string;
  topic: string;
  steps: string[];
  keyTip: string;
  similarQuestion: string;
  isFallback?: boolean;
}

// Helper: Greatest Common Divisor
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Helper: Least Common Multiple
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

// Helper: Prime factors with exponents
export function getPrimeFactors(n: number): { [prime: number]: number } {
  const factors: { [prime: number]: number } = {};
  let d = 2;
  let temp = Math.abs(n);
  while (temp >= 2) {
    if (temp % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      temp = temp / d;
    } else {
      d++;
      if (d * d > temp) {
        if (temp > 1) {
          factors[temp] = (factors[temp] || 0) + 1;
          break;
        }
      }
    }
  }
  return factors;
}

// Format prime factors into index form string: e.g. "2³ × 3² × 5"
export function formatIndexForm(factors: { [prime: number]: number }): string {
  const supMap: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  const parts = Object.keys(factors)
    .map(Number)
    .sort((a, b) => a - b)
    .map((prime) => {
      const exp = factors[prime];
      if (exp === 1) return `${prime}`;
      const expStr = exp.toString().split('').map((c) => supMap[c] || c).join('');
      return `${prime}${expStr}`;
    });
  return parts.join(' × ');
}

// Main fallback solver function
export function solveMathProblemLocally(question: string, gradeLevel: string = 'All JSS'): SolverResult {
  const text = question.trim();
  const lower = text.toLowerCase();

  // 1. HCF and LCM pattern (e.g., "HCF and LCM of 36 and 84")
  const hcfLcmMatch = lower.match(/(?:hcf|lcm|highest common factor|lowest common multiple).*?(\d+)\s*(?:and|,|&)\s*(\d+)/i) ||
                      lower.match(/(\d+)\s*(?:and|,|&)\s*(\d+).*?(?:hcf|lcm)/i);
  if (hcfLcmMatch) {
    const n1 = parseInt(hcfLcmMatch[1], 10);
    const n2 = parseInt(hcfLcmMatch[2], 10);
    const g = gcd(n1, n2);
    const l = lcm(n1, n2);

    const f1 = getPrimeFactors(n1);
    const f2 = getPrimeFactors(n2);

    const steps = [
      `**Step 1: Express both numbers as products of their prime factors**\n• ${n1} = ${formatIndexForm(f1)}\n• ${n2} = ${formatIndexForm(f2)}`,
      `**Step 2: Find the Highest Common Factor (HCF)**\nIdentify common prime factors with the *lowest* exponent in both factorizations:\n• HCF = ${g}`,
      `**Step 3: Find the Lowest Common Multiple (LCM)**\nTake all distinct prime factors with the *highest* exponent from both:\n• LCM = ${l}`,
      `**Step 4: Check using the Product Rule Formula**\n• Number 1 × Number 2 = ${n1} × ${n2} = ${n1 * n2}\n• HCF × LCM = ${g} × ${l} = ${g * l} (Verified! Both sides match!)`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `HCF = ${g}, LCM = ${l}`,
      gradeLevel: 'JSS 1',
      topic: 'Numbers & Numeration',
      steps,
      keyTip: 'Product Rule: For any two positive integers, HCF(a, b) × LCM(a, b) = a × b.',
      similarQuestion: `Find the HCF and LCM of ${n1 / 2 > 10 ? Math.round(n1 / 2) : 24} and ${n2 / 2 > 10 ? Math.round(n2 / 2) : 36}.`,
      isFallback: true,
    };
  }

  // 2. Prime factorization in index form (e.g., "Express 120 as a product of prime factors")
  const primeMatch = lower.match(/(?:prime factor|product of prime factors|prime factorization).*?(\d+)/i) ||
                     (lower.includes('index form') && lower.match(/(\d+)/));
  if (primeMatch && !lower.includes('hcf') && !lower.includes('lcm') && !lower.includes('expand')) {
    const num = parseInt(primeMatch[1], 10);
    if (num > 1) {
      const factors = getPrimeFactors(num);
      const indexForm = formatIndexForm(factors);
      const expandedForm = Object.keys(factors)
        .flatMap((p) => Array(factors[Number(p)]).fill(p))
        .join(' × ');

      const steps = [
        `**Step 1: Divide repeatedly by the smallest prime numbers** (2, 3, 5, 7...) until the quotient reaches 1.`,
        `**Step 2: Write out the full multiplication chain of prime factors:**\n• ${num} = ${expandedForm}`,
        `**Step 3: Collect repeated prime factors using index/exponent notation:**\n• ${num} = ${indexForm}`,
      ];

      return {
        extractedQuestion: text,
        finalAnswer: `${num} = ${indexForm}`,
        gradeLevel: 'JSS 1',
        topic: 'Numbers & Numeration',
        steps,
        keyTip: 'Index notation groups repeated multiplications: e.g. 2 × 2 × 2 is written as 2³.',
        similarQuestion: `Express ${num + 30} as a product of its prime factors in index form.`,
        isFallback: true,
      };
    }
  }

  // 3. Simple Linear Equation (e.g., "3x + 7 = 22" or "4x - 5 = 19" or "solve 2x + 8 = 20")
  const linearMatch = text.match(/([+-]?\s*\d*\s*[a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/);
  if (linearMatch) {
    let termX = linearMatch[1].replace(/\s+/g, '');
    let constantB = parseInt(linearMatch[2].replace(/\s+/g, ''), 10);
    let constantC = parseInt(linearMatch[3].replace(/\s+/g, ''), 10);

    const varChar = termX.match(/[a-zA-Z]/)?.[0] || 'x';
    const coefStr = termX.replace(varChar, '');
    let coefA = 1;
    if (coefStr === '' || coefStr === '+') coefA = 1;
    else if (coefStr === '-') coefA = -1;
    else coefA = parseInt(coefStr, 10);

    const step2Value = constantC - constantB;
    const finalValue = coefA !== 0 ? step2Value / coefA : 0;
    const formattedAnswer = Number.isInteger(finalValue) ? `${finalValue}` : finalValue.toFixed(2);

    const steps = [
      `**Step 1: Write down the linear equation**\n• ${coefA}${varChar} ${constantB >= 0 ? '+ ' + constantB : '- ' + Math.abs(constantB)} = ${constantC}`,
      `**Step 2: Isolate the variable term by collecting like terms**\nShift the constant ${constantB} to the right side (change sign):\n• ${coefA}${varChar} = ${constantC} ${constantB >= 0 ? '- ' + constantB : '+ ' + Math.abs(constantB)}\n• ${coefA}${varChar} = ${step2Value}`,
      `**Step 3: Divide both sides by the coefficient of ${varChar} (${coefA})**\n• ${varChar} = ${step2Value} ÷ ${coefA}\n• **${varChar} = ${formattedAnswer}**`,
      `**Step 4: Check by substitution**\nSubstitute ${varChar} = ${formattedAnswer} into the original equation:\n• ${coefA}(${formattedAnswer}) + (${constantB}) = ${coefA * finalValue + constantB} = ${constantC} (Confirmed correct!)`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `${varChar} = ${formattedAnswer}`,
      gradeLevel: 'JSS 1',
      topic: 'Algebraic Processes',
      steps,
      keyTip: 'Equation Balance Principle: Change side, change sign (+ becomes -, × becomes ÷).',
      similarQuestion: `Solve the linear equation: ${coefA + 1}${varChar} + ${Math.abs(constantB) + 2} = ${constantC + 10} for ${varChar}.`,
      isFallback: true,
    };
  }

  // 4. Binomial Expansion: e.g., (ax + b)(cx + d) or (2x + 3)(x - 4)
  const binomialMatch = text.match(/\(\s*([+-]?\s*\d*\s*[a-zA-Z])\s*([+-]\s*\d+)\s*\)\s*\(\s*([+-]?\s*\d*\s*[a-zA-Z])\s*([+-]\s*\d+)\s*\)/);
  if (binomialMatch) {
    const term1 = binomialMatch[1].replace(/\s+/g, '');
    const const1 = parseInt(binomialMatch[2].replace(/\s+/g, ''), 10);
    const term2 = binomialMatch[3].replace(/\s+/g, '');
    const const2 = parseInt(binomialMatch[4].replace(/\s+/g, ''), 10);

    const varChar = term1.match(/[a-zA-Z]/)?.[0] || 'x';
    const a1Str = term1.replace(varChar, '');
    const a1 = a1Str === '' || a1Str === '+' ? 1 : a1Str === '-' ? -1 : parseInt(a1Str, 10);
    const a2Str = term2.replace(varChar, '');
    const a2 = a2Str === '' || a2Str === '+' ? 1 : a2Str === '-' ? -1 : parseInt(a2Str, 10);

    // FOIL:
    // First: (a1*a2) x^2
    const firstCoef = a1 * a2;
    // Outside: a1 * const2
    const outsideCoef = a1 * const2;
    // Inside: const1 * a2
    const insideCoef = const1 * a2;
    // Last: const1 * const2
    const lastConst = const1 * const2;

    const middleCoef = outsideCoef + insideCoef;

    const formatPoly = (a: number, b: number, c: number, v: string) => {
      let str = '';
      if (a === 1) str += `${v}²`;
      else if (a === -1) str += `-${v}²`;
      else str += `${a}${v}²`;

      if (b > 0) str += ` + ${b === 1 ? '' : b}${v}`;
      else if (b < 0) str += ` - ${Math.abs(b) === 1 ? '' : Math.abs(b)}${v}`;

      if (c > 0) str += ` + ${c}`;
      else if (c < 0) str += ` - ${Math.abs(c)}`;
      return str;
    };

    const finalAnswer = formatPoly(firstCoef, middleCoef, lastConst, varChar);

    const steps = [
      `**Step 1: Apply the FOIL Method**\nFOIL stands for **F**irst, **O**utside, **I**nside, and **L**ast terms.`,
      `**Step 2: Multiply each pair systematically**\n• **First**: (${a1}${varChar}) × (${a2}${varChar}) = ${firstCoef}${varChar}²\n• **Outside**: (${a1}${varChar}) × (${const2}) = ${outsideCoef >= 0 ? '+' : ''}${outsideCoef}${varChar}\n• **Inside**: (${const1}) × (${a2}${varChar}) = ${insideCoef >= 0 ? '+' : ''}${insideCoef}${varChar}\n• **Last**: (${const1}) × (${const2}) = ${lastConst >= 0 ? '+' : ''}${lastConst}`,
      `**Step 3: Combine all terms**\n• ${firstCoef}${varChar}² ${outsideCoef >= 0 ? '+ ' + outsideCoef : '- ' + Math.abs(outsideCoef)}${varChar} ${insideCoef >= 0 ? '+ ' + insideCoef : '- ' + Math.abs(insideCoef)}${varChar} ${lastConst >= 0 ? '+ ' + lastConst : '- ' + Math.abs(lastConst)}`,
      `**Step 4: Collect like terms (the middle terms)**\n• (${outsideCoef}${varChar}) + (${insideCoef}${varChar}) = ${middleCoef >= 0 ? '+' : ''}${middleCoef}${varChar}\n• Result: **${finalAnswer}**`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer,
      gradeLevel: 'JSS 2',
      topic: 'Algebraic Processes',
      steps,
      keyTip: 'Always remember: The middle term comes from summing the Outside and Inside products: (ad + bc)x.',
      similarQuestion: `Expand and simplify: (${varChar} + 3)(${varChar} - 5).`,
      isFallback: true,
    };
  }

  // 5. Pythagorean Theorem (e.g. "sides of lengths 5 cm and 12 cm. hypotenuse")
  const pythMatch = lower.match(/(?:pythagor|hypotenuse|right-angled triangle).*?(\d+(?:\.\d+)?)\s*(?:cm|m)?\s*(?:and|,|&)\s*(\d+(?:\.\d+)?)\s*(?:cm|m)?/i) ||
                    lower.match(/(\d+(?:\.\d+)?)\s*(?:cm|m)?\s*(?:and|,|&)\s*(\d+(?:\.\d+)?)\s*(?:cm|m)?.*?(?:pythagor|hypotenuse)/i);
  if (pythMatch) {
    const a = parseFloat(pythMatch[1]);
    const b = parseFloat(pythMatch[2]);
    const cSq = a * a + b * b;
    const c = Math.sqrt(cSq);
    const cFormatted = Number.isInteger(c) ? `${c}` : c.toFixed(2);

    const steps = [
      `**Step 1: State the Pythagorean Theorem**\nFor any right-angled triangle with perpendicular sides *a* and *b*, and hypotenuse *c*:\n• **c² = a² + b²**`,
      `**Step 2: Substitute the given lengths**\n• a = ${a} cm\n• b = ${b} cm\n• c² = (${a})² + (${b})²\n• c² = ${a * a} + ${b * b} = ${cSq}`,
      `**Step 3: Take the square root of both sides**\n• c = √${cSq}\n• **c = ${cFormatted} cm**`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `Hypotenuse c = ${cFormatted} cm`,
      gradeLevel: 'JSS 3',
      topic: 'Geometry & Mensuration',
      steps,
      keyTip: 'The hypotenuse is ALWAYS the longest side, located directly opposite the 90° right angle.',
      similarQuestion: `Find the hypotenuse of a right-angled triangle with sides 6 cm and 8 cm.`,
      isFallback: true,
    };
  }

  // 6. Speed, Distance & Time (e.g. "150 kilometers in 2.5 hours. Calculate average speed")
  const speedMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometers|m|metres|meters)\s*(?:in|for)\s*(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr|seconds|s|mins|minutes)/i);
  if (speedMatch) {
    const dist = parseFloat(speedMatch[1]);
    const time = parseFloat(speedMatch[2]);
    const speed = dist / time;
    const speedFormatted = Number.isInteger(speed) ? `${speed}` : speed.toFixed(2);

    const steps = [
      `**Step 1: Identify given quantities**\n• Distance (d) = ${dist} km\n• Time (t) = ${time} hours`,
      `**Step 2: State the Speed Formula**\n• **Speed (v) = Distance ÷ Time** (v = d / t)`,
      `**Step 3: Perform the calculation**\n• Speed = ${dist} ÷ ${time}\n• **Speed = ${speedFormatted} km/h**`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `${speedFormatted} km/h`,
      gradeLevel: 'JSS 2',
      topic: 'Everyday Math & Physics Intro',
      steps,
      keyTip: 'Remember the D-S-T Triangle: Distance = Speed × Time; Speed = Distance ÷ Time; Time = Distance ÷ Speed.',
      similarQuestion: `A vehicle travels 240 km in 3 hours. Calculate its average speed.`,
      isFallback: true,
    };
  }

  // 7. Circle Area and Circumference (e.g. "area and perimeter of circle radius 7 cm")
  const circleMatch = lower.match(/(?:circle|radius|diameter).*?(\d+(?:\.\d+)?)\s*(?:cm|m)?/i);
  if (circleMatch && (lower.includes('circle') || lower.includes('radius') || lower.includes('circumference'))) {
    const r = parseFloat(circleMatch[1]);
    const pi = 22 / 7;
    const circ = 2 * pi * r;
    const area = pi * r * r;

    const circFormatted = Number.isInteger(circ) ? `${circ}` : circ.toFixed(2);
    const areaFormatted = Number.isInteger(area) ? `${area}` : area.toFixed(2);

    const steps = [
      `**Step 1: Identify given radius and formulas**\n• Radius (r) = ${r} cm (taking π ≈ 22/7)\n• Circumference formula: C = 2 × π × r\n• Area formula: A = π × r²`,
      `**Step 2: Calculate Circumference (Perimeter)**\n• C = 2 × (22/7) × ${r}\n• C = ${circFormatted} cm`,
      `**Step 3: Calculate Area**\n• A = (22/7) × (${r})² = (22/7) × ${r * r}\n• A = ${areaFormatted} cm²`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `Circumference = ${circFormatted} cm, Area = ${areaFormatted} cm²`,
      gradeLevel: 'JSS 2',
      topic: 'Geometry & Mensuration',
      steps,
      keyTip: 'Circumference has linear units (cm), while Area is measured in square units (cm²).',
      similarQuestion: `Find the area and circumference of a circle with radius 14 cm (π = 22/7).`,
      isFallback: true,
    };
  }

  // 8. Simple Interest (e.g. "Simple Interest on 40,000 for 3 years at 5%")
  const interestMatch = lower.match(/(?:interest|simple interest).*?(?:₦|\$|£|#)?\s*(\d+(?:,\d+)*(?:\.\d+)?).*?(\d+(?:\.\d+)?)\s*(?:years|yrs).*?(\d+(?:\.\d+)?)\s*%/i) ||
                        lower.match(/(?:₦|\$|£|#)?\s*(\d+(?:,\d+)*(?:\.\d+)?).*?(\d+(?:\.\d+)?)\s*%.*?(\d+(?:\.\d+)?)\s*(?:years|yrs)/i);
  if (interestMatch) {
    const pStr = interestMatch[1].replace(/,/g, '');
    const principal = parseFloat(pStr);
    let time = parseFloat(interestMatch[2]);
    let rate = parseFloat(interestMatch[3]);
    if (lower.includes(`${interestMatch[2]}%`)) {
      rate = parseFloat(interestMatch[2]);
      time = parseFloat(interestMatch[3]);
    }

    const interest = (principal * rate * time) / 100;
    const totalAmount = principal + interest;

    const steps = [
      `**Step 1: Identify the given financial terms**\n• Principal (P) = ₦${principal.toLocaleString()}\n• Rate (R) = ${rate}%\n• Time (T) = ${time} years`,
      `**Step 2: State the Simple Interest Formula**\n• **I = (P × R × T) / 100**`,
      `**Step 3: Calculate Interest**\n• I = (${principal} × ${rate} × ${time}) / 100 = ${(principal * rate * time)} / 100\n• **Interest (I) = ₦${interest.toLocaleString()}**`,
      `**Step 4: Calculate Total Amount (A)**\n• Total Amount = Principal + Interest\n• Amount = ₦${principal.toLocaleString()} + ₦${interest.toLocaleString()} = **₦${totalAmount.toLocaleString()}**`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `Interest = ₦${interest.toLocaleString()}, Total Amount = ₦${totalAmount.toLocaleString()}`,
      gradeLevel: 'JSS 3',
      topic: 'Everyday Math & Physics Intro',
      steps,
      keyTip: 'Simple Interest Formula: I = PRT / 100. Time must always be in years.',
      similarQuestion: `Calculate the Simple Interest on ₦50,000 at 4% for 2 years.`,
      isFallback: true,
    };
  }

  // 9. Percentage calculation (e.g. "15% of 240")
  const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = parseFloat(pctMatch[1]);
    const val = parseFloat(pctMatch[2]);
    const result = (pct / 100) * val;
    const resFormatted = Number.isInteger(result) ? `${result}` : result.toFixed(2);

    const steps = [
      `**Step 1: Understand what percentage means**\n"Percent" means "out of 100". So ${pct}% = ${pct} / 100.`,
      `**Step 2: Set up the multiplication**\n• (${pct} / 100) × ${val}`,
      `**Step 3: Simplify and compute**\n• (${pct} × ${val}) / 100 = ${pct * val} / 100\n• Result = **${resFormatted}**`,
    ];

    return {
      extractedQuestion: text,
      finalAnswer: `${resFormatted}`,
      gradeLevel: 'JSS 1',
      topic: 'Numbers & Numeration',
      steps,
      keyTip: 'The word "of" in mathematics translates directly to multiplication (×).',
      similarQuestion: `Find 25% of ${val * 2}.`,
      isFallback: true,
    };
  }

  // 10. General Arithmetic / BODMAS evaluation (e.g. "12 + 4 * 3" or "(15 - 3) * 4 / 2")
  const sanitizedMath = text.replace(/[^0-9+\-*/().]/g, '');
  if (sanitizedMath.length >= 3 && /[+\-*/]/.test(sanitizedMath)) {
    try {
      // Safe arithmetic evaluator
      // eslint-disable-next-line no-eval
      const evalVal = Function(`'use strict'; return (${sanitizedMath})`)();
      if (typeof evalVal === 'number' && !isNaN(evalVal) && isFinite(evalVal)) {
        const formatted = Number.isInteger(evalVal) ? `${evalVal}` : evalVal.toFixed(3);
        const steps = [
          `**Step 1: Review BODMAS / PEMDAS Order of Operations**\n1. **B**rackets / Parentheses ( )\n2. **O**rders / Exponents\n3. **D**ivision and **M**ultiplication (left to right)\n4. **A**ddition and **S**ubtraction (left to right)`,
          `**Step 2: Evaluate the expression systematically**\n• Original: ${sanitizedMath}`,
          `**Step 3: Final Computed Result**\n• **Answer = ${formatted}**`,
        ];

        return {
          extractedQuestion: text,
          finalAnswer: `${formatted}`,
          gradeLevel: 'JSS 1',
          topic: 'Numbers & Numeration',
          steps,
          keyTip: 'BODMAS rule: Always resolve operations inside brackets first before multiplication and addition!',
          similarQuestion: `Evaluate: 18 ÷ 3 + 4 × 2 - 5.`,
          isFallback: true,
        };
      }
    } catch {
      // fall through
    }
  }

  // 11. General Catch-All Pedagogical Response for any JSS Problem
  return {
    extractedQuestion: text,
    finalAnswer: 'See step-by-step guidance below',
    gradeLevel: gradeLevel && gradeLevel !== 'All JSS' ? gradeLevel : 'JSS 2',
    topic: 'Junior Secondary Mathematics',
    steps: [
      `**Step 1: Understand the Goal**\nAnalyze the question carefully: "${text}". Identify the given values, the unknown quantity, and the required unit.`,
      `**Step 2: Choose the Correct Formula or Rule**\n• For Equations: Group unknown variables on the left and constants on the right.\n• For Geometry: Identify whether area (units²), perimeter (units), or volume (units³) is asked.\n• For Numbers: Look for prime factors, common divisors, or order of operations (BODMAS).`,
      `**Step 3: Execute the Calculation Carefully**\nWork through the algebraic or arithmetic operations step-by-step, taking special care with negative signs and fractions.`,
      `**Step 4: Check and Verify Your Solution**\nSubstitute your final answer back into the original problem statement to confirm both sides balance.`,
    ],
    keyTip: 'Always write down the formula first before inserting values to earn full working marks in exams!',
    similarQuestion: 'Try rewriting the problem with simpler numbers to verify your method first.',
    isFallback: true,
  };
}

export function getFallbackPracticeQuestion(topic?: string, gradeLevel: string = 'JSS 2', _sourceQuestion?: string) {
  const bank = [
    {
      topic: 'Algebraic Processes',
      gradeLevel: 'JSS 1',
      question: 'Solve for y in the linear equation: 5y - 7 = 28',
      options: ['A) y = 5', 'B) y = 7', 'C) y = 6', 'D) y = 8'],
      correctOptionIndex: 1,
      finalAnswer: 'y = 7',
      hint: 'Add 7 to both sides of the equation first, then divide by 5.',
      explanation: '5y - 7 = 28 ➔ 5y = 28 + 7 ➔ 5y = 35 ➔ y = 35 ÷ 5 = 7.',
    },
    {
      topic: 'Algebraic Processes',
      gradeLevel: 'JSS 2',
      question: 'Expand and simplify: (x + 4)(x - 3)',
      options: ['A) x² + x - 12', 'B) x² - x - 12', 'C) x² + 7x - 12', 'D) x² - 12'],
      correctOptionIndex: 0,
      finalAnswer: 'x² + x - 12',
      hint: 'Apply FOIL: First (x·x), Outside (-3·x), Inside (4·x), Last (4·-3).',
      explanation: '(x + 4)(x - 3) = x² - 3x + 4x - 12 = x² + x - 12.',
    },
    {
      topic: 'Numbers & Numeration',
      gradeLevel: 'JSS 1',
      question: 'Find the Highest Common Factor (HCF) of 18 and 30.',
      options: ['A) 3', 'B) 6', 'C) 9', 'D) 15'],
      correctOptionIndex: 1,
      finalAnswer: '6',
      hint: 'Factors of 18: 1, 2, 3, 6, 9, 18. Factors of 30: 1, 2, 3, 5, 6, 10, 15, 30.',
      explanation: 'The common factors are 1, 2, 3, and 6. The highest among them is 6.',
    },
    {
      topic: 'Numbers & Numeration',
      gradeLevel: 'JSS 2',
      question: 'Evaluate 25% of ₦480.',
      options: ['A) ₦96', 'B) ₦120', 'C) ₦140', 'D) ₦160'],
      correctOptionIndex: 1,
      finalAnswer: '₦120',
      hint: '25% is equivalent to the fraction 1/4.',
      explanation: '25% of 480 = (25 / 100) × 480 = 480 ÷ 4 = ₦120.',
    },
    {
      topic: 'Geometry & Mensuration',
      gradeLevel: 'JSS 2',
      question: 'Calculate the perimeter of a rectangle with length 12 cm and breadth 8 cm.',
      options: ['A) 96 cm', 'B) 40 cm', 'C) 20 cm', 'D) 48 cm'],
      correctOptionIndex: 1,
      finalAnswer: '40 cm',
      hint: 'Perimeter of rectangle formula is P = 2 × (length + breadth).',
      explanation: 'P = 2 × (12 + 8) = 2 × 20 = 40 cm.',
    },
    {
      topic: 'Geometry & Mensuration',
      gradeLevel: 'JSS 3',
      question: 'In a right-angled triangle, the legs are 9 cm and 12 cm. Find the hypotenuse.',
      options: ['A) 15 cm', 'B) 21 cm', 'C) 18 cm', 'D) 25 cm'],
      correctOptionIndex: 0,
      finalAnswer: '15 cm',
      hint: 'Use Pythagoras theorem: c² = a² + b².',
      explanation: 'c² = 9² + 12² = 81 + 144 = 225. c = √225 = 15 cm.',
    },
    {
      topic: 'Everyday Math & Physics Intro',
      gradeLevel: 'JSS 2',
      question: 'A cyclist rides 45 km in 1.5 hours. What is the average speed?',
      options: ['A) 25 km/h', 'B) 30 km/h', 'C) 35 km/h', 'D) 40 km/h'],
      correctOptionIndex: 1,
      finalAnswer: '30 km/h',
      hint: 'Speed = Distance ÷ Time.',
      explanation: 'Speed = 45 ÷ 1.5 = 30 km/h.',
    },
    {
      topic: 'Everyday Math & Physics Intro',
      gradeLevel: 'JSS 3',
      question: 'Calculate the Simple Interest on ₦20,000 for 3 years at 6% per annum.',
      options: ['A) ₦1,200', 'B) ₦2,400', 'C) ₦3,600', 'D) ₦4,800'],
      correctOptionIndex: 2,
      finalAnswer: '₦3,600',
      hint: 'I = (P × R × T) / 100.',
      explanation: 'I = (20,000 × 6 × 3) / 100 = 360,000 / 100 = ₦3,600.',
    },
  ];

  const matched = bank.filter((q) => {
    if (topic && q.topic.toLowerCase() === topic.toLowerCase()) return true;
    if (gradeLevel && gradeLevel !== 'All JSS' && q.gradeLevel === gradeLevel) return true;
    return false;
  });

  const selected = matched.length > 0
    ? matched[Math.floor(Math.random() * matched.length)]
    : bank[Math.floor(Math.random() * bank.length)];

  return selected;
}

export function getFallbackHint(question: string, userAttempt?: string): string {
  const lower = question.toLowerCase();
  if (lower.includes('hcf') || lower.includes('factor')) {
    return 'Start by writing each number as a product of prime factors. For HCF, pick common primes with the lowest powers.';
  }
  if (lower.includes('lcm') || lower.includes('multiple')) {
    return 'Break down each number into primes, then take all prime factors with their highest exponents.';
  }
  if (lower.includes('=') || lower.includes('solve')) {
    return 'Isolate the variable term on one side of the equation. Remember: whatever operation you do to the left side, do to the right side.';
  }
  if (lower.includes('expand') || lower.includes('binomial')) {
    return 'Use the FOIL technique: First, Outside, Inside, Last. Don\'t forget to collect like terms at the end!';
  }
  if (lower.includes('area') || lower.includes('perimeter')) {
    return 'Identify the shape first, write down the formula (e.g. Area = ½ × b × h or πr²), and check the units.';
  }
  if (lower.includes('pythagor') || lower.includes('triangle') || lower.includes('hypotenuse')) {
    return 'Use the Pythagorean theorem: c² = a² + b², where c is the hypotenuse facing the 90° angle.';
  }
  if (lower.includes('speed') || lower.includes('distance') || lower.includes('time')) {
    return 'Use the formula Speed = Distance ÷ Time. Make sure time is in hours if distance is in kilometers.';
  }
  if (lower.includes('interest')) {
    return 'Remember: Simple Interest I = (P × R × T) / 100, where T must be in years.';
  }
  if (userAttempt) {
    return `You're making great progress! Review your arithmetic steps and double-check your signs carefully.`;
  }
  return 'Read the problem carefully, write down the known values, identify what needs to be found, and state your formula first!';
}

