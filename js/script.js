const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambiguous: '0O1lI'
};


const elements = {
    passwordOutput: document.getElementById('passwordOutput'),
    copyBtn: document.getElementById('copyBtn'),
    generateBtn: document.getElementById('generateBtn'),
    lengthSlider: document.getElementById('length'),
    lengthValue: document.getElementById('lengthValue'),
    strengthBar: document.getElementById('strengthBar'),
    strengthText: document.getElementById('strengthText'),
    crackTime: document.getElementById('crackTime'),
    checkboxes: {
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        numbers: document.getElementById('numbers'),
        symbols: document.getElementById('symbols'),
        excludeAmbiguous: document.getElementById('excludeAmbiguous')
    }
};


document.addEventListener('DOMContentLoaded', function() {
    loadSavedPreferences();
    initializeEventListeners();
    updateLengthDisplay();
    generatePassword();
    checkDarkMode();
});


function initializeEventListeners() {
    elements.generateBtn.addEventListener('click', generatePassword);
    elements.copyBtn.addEventListener('click', copyToClipboard);
    
    elements.lengthSlider.addEventListener('input', function() {
        updateLengthDisplay();
        generatePassword();
        savePreferences();
    });
    
    Object.values(elements.checkboxes).forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            generatePassword();
            savePreferences();
        });
    });
    
    elements.passwordOutput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            generatePassword();
        }
    });
    
    // Añadir listener para el botón de limpiar historial si existe
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearPasswordHistory);
    }
    
    // Añadir listener para el toggle de modo oscuro si existe
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
    }
    
    // Atajos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'g') {
            e.preventDefault();
            generatePassword();
        }
        else if (e.altKey && e.key === 'c') {
            e.preventDefault();
            copyToClipboard();
        }
    });
}


function updateLengthDisplay() {
    elements.lengthValue.textContent = elements.lengthSlider.value;
}


function generatePassword() {
    const options = getPasswordOptions();
    
    // Validar que al menos una opción esté seleccionada
    if (!validateOptions(options)) {
        showError('Debes seleccionar al menos un tipo de carácter');
        return;
    }
    
    const password = createPassword(options);
    displayPassword(password);
    updateStrengthIndicator(password, options);
    updateCrackTime(password);
}

// Obtener opciones seleccionadas
function getPasswordOptions() {
    return {
        length: parseInt(elements.lengthSlider.value),
        includeUppercase: elements.checkboxes.uppercase.checked,
        includeLowercase: elements.checkboxes.lowercase.checked,
        includeNumbers: elements.checkboxes.numbers.checked,
        includeSymbols: elements.checkboxes.symbols.checked,
        excludeAmbiguous: elements.checkboxes.excludeAmbiguous.checked
    };
}

// Validar que al menos una opción esté seleccionada
function validateOptions(options) {
    return options.includeUppercase || 
        options.includeLowercase || 
        options.includeNumbers || 
        options.includeSymbols;
}

// Crear la contraseña basada en las opciones
function createPassword(options) {
    let availableChars = '';
    let guaranteedChars = '';
    
    // Construir conjunto de caracteres disponibles
    if (options.includeUppercase) {
        let chars = characterSets.uppercase;
        if (options.excludeAmbiguous) {
            chars = removeAmbiguousChars(chars);
        }
        availableChars += chars;
        guaranteedChars += getRandomChar(chars);
    }
    
    if (options.includeLowercase) {
        let chars = characterSets.lowercase;
        if (options.excludeAmbiguous) {
            chars = removeAmbiguousChars(chars);
        }
        availableChars += chars;
        guaranteedChars += getRandomChar(chars);
    }
    
    if (options.includeNumbers) {
        let chars = characterSets.numbers;
        if (options.excludeAmbiguous) {
            chars = removeAmbiguousChars(chars);
        }
        availableChars += chars;
        guaranteedChars += getRandomChar(chars);
    }
    
    if (options.includeSymbols) {
        availableChars += characterSets.symbols;
        guaranteedChars += getRandomChar(characterSets.symbols);
    }
    
    // Generar el resto de la contraseña
    let password = guaranteedChars;
    const remainingLength = options.length - guaranteedChars.length;
    
    for (let i = 0; i < remainingLength; i++) {
        password += getRandomChar(availableChars);
    }
    
    // Mezclar la contraseña para que los caracteres garantizados no estén al inicio
    return shuffleString(password);
}

// Remover caracteres ambiguos
function removeAmbiguousChars(chars) {
    return chars.split('').filter(char => 
        !characterSets.ambiguous.includes(char)
    ).join('');
}

// Obtener carácter aleatorio de un conjunto
function getRandomChar(chars) {
    return chars[Math.floor(Math.random() * chars.length)];
}

// Mezclar string aleatoriamente
function shuffleString(str) {
    return str.split('').sort(() => Math.random() - 0.5).join('');
}


let passwordHistory = [];
const MAX_HISTORY = 5;


function displayPassword(password) {
    elements.passwordOutput.value = password;
    elements.passwordOutput.style.color = '#2c3e50';
    

    addToHistory(password);
}


function addToHistory(password) {

    if (passwordHistory.includes(password)) return;
    

    passwordHistory.unshift(password);
    

    if (passwordHistory.length > MAX_HISTORY) {
        passwordHistory.pop();
    }
    

    updateHistoryUI();
}


function updateHistoryUI() {
    const historyElement = document.getElementById('passwordHistory');
    if (!historyElement) return;
    
    historyElement.innerHTML = '';
    

    if (passwordHistory.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-history-message';
        emptyMsg.textContent = 'No hay contraseñas en el historial';
        historyElement.appendChild(emptyMsg);
        

        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    

    const clearBtn = document.getElementById('clearHistoryBtn');
    if (clearBtn) clearBtn.style.display = 'block';
    
    passwordHistory.forEach(pwd => {
        const li = document.createElement('li');
        li.textContent = pwd;
        li.addEventListener('click', () => {
            elements.passwordOutput.value = pwd;
            updateStrengthIndicator(pwd, getPasswordOptions());
            updateCrackTime(pwd);
        });
        historyElement.appendChild(li);
    });
}
// Copiar contraseña al portapapeles
async function copyToClipboard() {
    const password = elements.passwordOutput.value;
    
    if (!password) {
        showError('No hay contraseña para copiar');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(password);
        showCopySuccess();
    } catch (err) {
        // Fallback para navegadores que no soportan clipboard API
        fallbackCopyToClipboard(password);
    }
}

// Método alternativo para copiar (fallback)
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        showError('Error al copiar la contraseña');
    }
    
    document.body.removeChild(textArea);
}

// Mostrar feedback de copiado exitoso
function showCopySuccess() {
    const originalText = elements.copyBtn.innerHTML;
    elements.copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    elements.copyBtn.classList.add('copied');
    

    showNotification('¡Contraseña copiada al portapapeles!', 'success');
    
    setTimeout(() => {
        elements.copyBtn.innerHTML = originalText;
        elements.copyBtn.classList.remove('copied');
    }, 2000);
}


function updateStrengthIndicator(password, options) {
    const strength = calculatePasswordStrength(password, options);
    const strengthClass = getStrengthClass(strength.score);
    const strengthText = getStrengthText(strength.score);
    
    elements.strengthBar.className = `strength-fill ${strengthClass}`;
    elements.strengthText.textContent = `${strengthText} (${strength.score}/4)`;
}


function calculatePasswordStrength(password, options) {
    let score = 0;
    let feedback = [];
    

    if (password.length >= 12) score += 1;
    else feedback.push('Usa al menos 12 caracteres');
    

    let charTypes = 0;
    if (options.includeUppercase) charTypes++;
    if (options.includeLowercase) charTypes++;
    if (options.includeNumbers) charTypes++;
    if (options.includeSymbols) charTypes++;
    
    if (charTypes >= 3) score += 1;
    else feedback.push('Incluye más tipos de caracteres');
    

    if (password.length >= 16) score += 1;
    

    if (password.length >= 20 && charTypes === 4) score += 1;
    
    return { score, feedback };
}


function getStrengthClass(score) {
    const classes = ['weak', 'fair', 'good', 'strong'];
    return classes[Math.min(score, 3)];
}


function getStrengthText(score) {
    const texts = ['Débil', 'Regular', 'Buena', 'Fuerte'];
    return texts[Math.min(score, 3)];
}


function updateCrackTime(password) {
    const entropy = calculateEntropy(password);
    const crackTime = estimateCrackTime(entropy);
    elements.crackTime.textContent = crackTime;
}


function calculateEntropy(password) {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
    
    return password.length * Math.log2(charsetSize);
}


function estimateCrackTime(entropy) {

    const attemptsPerSecond = 1e12;
    const secondsToBreak = Math.pow(2, entropy - 1) / attemptsPerSecond;
    
    if (secondsToBreak < 60) return 'Menos de 1 minuto';
    if (secondsToBreak < 3600) return `${Math.round(secondsToBreak / 60)} minutos`;
    if (secondsToBreak < 86400) return `${Math.round(secondsToBreak / 3600)} horas`;
    if (secondsToBreak < 31536000) return `${Math.round(secondsToBreak / 86400)} días`;
    if (secondsToBreak < 31536000000) return `${Math.round(secondsToBreak / 31536000)} años`;
    
    return 'Más de 1000 años';
}


function showError(message) {
    elements.passwordOutput.value = message;
    elements.passwordOutput.style.color = '#e74c3c';
    elements.strengthBar.className = 'strength-fill';
    elements.strengthText.textContent = 'Error';
    elements.crackTime.textContent = 'N/A';
}


function addRotatingEffect() {
    elements.generateBtn.querySelector('i').style.transform = 'rotate(360deg)';
    setTimeout(() => {
        elements.generateBtn.querySelector('i').style.transform = 'rotate(0deg)';
    }, 300);
}


elements.generateBtn.addEventListener('click', addRotatingEffect);


function savePreferences() {
    const preferences = {
        length: elements.lengthSlider.value,
        uppercase: elements.checkboxes.uppercase.checked,
        lowercase: elements.checkboxes.lowercase.checked,
        numbers: elements.checkboxes.numbers.checked,
        symbols: elements.checkboxes.symbols.checked,
        excludeAmbiguous: elements.checkboxes.excludeAmbiguous.checked,
        darkMode: document.body.classList.contains('dark-mode')
    };
    
    localStorage.setItem('passwordGeneratorPreferences', JSON.stringify(preferences));
}

function loadSavedPreferences() {
    const savedPreferences = JSON.parse(localStorage.getItem('passwordGeneratorPreferences'));
    
    if (savedPreferences) {

        elements.lengthSlider.value = savedPreferences.length || 12;
        elements.checkboxes.uppercase.checked = savedPreferences.uppercase !== undefined ? savedPreferences.uppercase : true;
        elements.checkboxes.lowercase.checked = savedPreferences.lowercase !== undefined ? savedPreferences.lowercase : true;
        elements.checkboxes.numbers.checked = savedPreferences.numbers !== undefined ? savedPreferences.numbers : true;
        elements.checkboxes.symbols.checked = savedPreferences.symbols !== undefined ? savedPreferences.symbols : false;
        elements.checkboxes.excludeAmbiguous.checked = savedPreferences.excludeAmbiguous !== undefined ? savedPreferences.excludeAmbiguous : false;
        

        if (savedPreferences.darkMode) {
            document.body.classList.add('dark-mode');
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) darkModeToggle.checked = true;
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    savePreferences();
}

function checkDarkMode() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedPreferences = JSON.parse(localStorage.getItem('passwordGeneratorPreferences'));
    
    if (!savedPreferences && prefersDarkMode) {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) darkModeToggle.checked = true;
        savePreferences();
    }
}

function clearPasswordHistory() {
    if (confirm('¿Estás seguro de que deseas eliminar todo el historial de contraseñas?')) {
        passwordHistory = [];
        localStorage.removeItem('passwordHistory');
        updateHistoryUI();
        showNotification('Historial eliminado correctamente', 'success');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    notification.offsetHeight;
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}