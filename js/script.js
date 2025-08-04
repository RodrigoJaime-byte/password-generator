// Conjuntos de caracteres
const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambiguous: '0O1lI' // Caracteres que pueden confundirse
};

// Referencias DOM
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

// Inicio
document.addEventListener('DOMContentLoaded', function() {
    loadSavedPreferences();
    initializeEventListeners();
    updateLengthDisplay();
    generatePassword();
    checkDarkMode();
});

// Eventos
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

// Actualizar el display de la longitud
function updateLengthDisplay() {
    elements.lengthValue.textContent = elements.lengthSlider.value;
}

// Función principal para generar contraseña
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

// Mostrar la contraseña generada
// Historial de contraseñas
let passwordHistory = [];
const MAX_HISTORY = 5;

// Actualizar función displayPassword para guardar en historial
function displayPassword(password) {
    elements.passwordOutput.value = password;
    elements.passwordOutput.style.color = '#2c3e50';
    
    // Añadir al historial
    addToHistory(password);
}

// Añadir contraseña al historial
function addToHistory(password) {
    // Evitar duplicados
    if (passwordHistory.includes(password)) return;
    
    // Añadir al inicio del array
    passwordHistory.unshift(password);
    
    // Limitar a MAX_HISTORY elementos
    if (passwordHistory.length > MAX_HISTORY) {
        passwordHistory.pop();
    }
    
    // Actualizar UI del historial si existe
    updateHistoryUI();
}

// Actualizar UI del historial
function updateHistoryUI() {
    const historyElement = document.getElementById('passwordHistory');
    if (!historyElement) return;
    
    historyElement.innerHTML = '';
    
    // Mostrar mensaje si el historial está vacío
    if (passwordHistory.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-history-message';
        emptyMsg.textContent = 'No hay contraseñas en el historial';
        historyElement.appendChild(emptyMsg);
        
        // Ocultar botón de limpiar historial si existe
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    // Mostrar botón de limpiar historial si existe
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
    
    // Mostrar notificación
    showNotification('¡Contraseña copiada al portapapeles!', 'success');
    
    setTimeout(() => {
        elements.copyBtn.innerHTML = originalText;
        elements.copyBtn.classList.remove('copied');
    }, 2000);
}

// Actualizar indicador de fortaleza
function updateStrengthIndicator(password, options) {
    const strength = calculatePasswordStrength(password, options);
    const strengthClass = getStrengthClass(strength.score);
    const strengthText = getStrengthText(strength.score);
    
    elements.strengthBar.className = `strength-fill ${strengthClass}`;
    elements.strengthText.textContent = `${strengthText} (${strength.score}/4)`;
}

// Calcular fortaleza de la contraseña
function calculatePasswordStrength(password, options) {
    let score = 0;
    let feedback = [];
    
    // Longitud
    if (password.length >= 12) score += 1;
    else feedback.push('Usa al menos 12 caracteres');
    
    // Variedad de caracteres
    let charTypes = 0;
    if (options.includeUppercase) charTypes++;
    if (options.includeLowercase) charTypes++;
    if (options.includeNumbers) charTypes++;
    if (options.includeSymbols) charTypes++;
    
    if (charTypes >= 3) score += 1;
    else feedback.push('Incluye más tipos de caracteres');
    
    // Longitud adicional
    if (password.length >= 16) score += 1;
    
    // Complejidad máxima
    if (password.length >= 20 && charTypes === 4) score += 1;
    
    return { score, feedback };
}

// Obtener clase CSS para la fortaleza
function getStrengthClass(score) {
    const classes = ['weak', 'fair', 'good', 'strong'];
    return classes[Math.min(score, 3)];
}

// Obtener texto descriptivo de la fortaleza
function getStrengthText(score) {
    const texts = ['Débil', 'Regular', 'Buena', 'Fuerte'];
    return texts[Math.min(score, 3)];
}

// Actualizar tiempo estimado para romper la contraseña
function updateCrackTime(password) {
    const entropy = calculateEntropy(password);
    const crackTime = estimateCrackTime(entropy);
    elements.crackTime.textContent = crackTime;
}

// Calcular entropía de la contraseña
function calculateEntropy(password) {
    let charsetSize = 0;
    
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
    
    return password.length * Math.log2(charsetSize);
}

// Estimar tiempo para romper la contraseña
function estimateCrackTime(entropy) {
    // Asumiendo 1 billón de intentos por segundo
    const attemptsPerSecond = 1e12;
    const secondsToBreak = Math.pow(2, entropy - 1) / attemptsPerSecond;
    
    if (secondsToBreak < 60) return 'Menos de 1 minuto';
    if (secondsToBreak < 3600) return `${Math.round(secondsToBreak / 60)} minutos`;
    if (secondsToBreak < 86400) return `${Math.round(secondsToBreak / 3600)} horas`;
    if (secondsToBreak < 31536000) return `${Math.round(secondsToBreak / 86400)} días`;
    if (secondsToBreak < 31536000000) return `${Math.round(secondsToBreak / 31536000)} años`;
    
    return 'Más de 1000 años';
}

// Mostrar mensaje de error
function showError(message) {
    elements.passwordOutput.value = message;
    elements.passwordOutput.style.color = '#e74c3c';
    elements.strengthBar.className = 'strength-fill';
    elements.strengthText.textContent = 'Error';
    elements.crackTime.textContent = 'N/A';
}

// Funciones de utilidad adicionales
function addRotatingEffect() {
    elements.generateBtn.querySelector('i').style.transform = 'rotate(360deg)';
    setTimeout(() => {
        elements.generateBtn.querySelector('i').style.transform = 'rotate(0deg)';
    }, 300);
}

// Agregar efecto de rotación al generar
elements.generateBtn.addEventListener('click', addRotatingEffect);

// Preferencias y modo oscuro
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
        // Aplicar preferencias guardadas
        elements.lengthSlider.value = savedPreferences.length || 12;
        elements.checkboxes.uppercase.checked = savedPreferences.uppercase !== undefined ? savedPreferences.uppercase : true;
        elements.checkboxes.lowercase.checked = savedPreferences.lowercase !== undefined ? savedPreferences.lowercase : true;
        elements.checkboxes.numbers.checked = savedPreferences.numbers !== undefined ? savedPreferences.numbers : true;
        elements.checkboxes.symbols.checked = savedPreferences.symbols !== undefined ? savedPreferences.symbols : false;
        elements.checkboxes.excludeAmbiguous.checked = savedPreferences.excludeAmbiguous !== undefined ? savedPreferences.excludeAmbiguous : false;
        
        // Aplicar modo oscuro si estaba activado
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
    notification.offsetHeight; // Forzar reflow
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}