// Funciones para manejar cookies
function setCookie(name, value, days = 30) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Función para obtener parámetros de la URL
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Función para determinar la fuente de tráfico
function determineTrafficSource() {
    const referrer = document.referrer;
    const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'yandex.com'];
    
    let source = getParameterByName('utm_source');
    let medium = getParameterByName('utm_medium');
    
    if (!source) {
        if (!referrer) {
            source = '(direct)';
            medium = '(none)';
        } else {
            const referrerUrl = new URL(referrer);
            if (searchEngines.some(engine => referrerUrl.hostname.includes(engine))) {
                source = '(organic)';
                medium = 'organic';
            } else {
                source = '(referral)';
                medium = 'referral';
            }
        }
    }
    
    return {
        source: source || '(none)',
        medium: medium || '(none)',
        campaign: getParameterByName('utm_campaign') || '(none)',
        term: getParameterByName('utm_term') || '(none)',
        content: getParameterByName('utm_content') || '(none)'
    };
}

// Función para actualizar cookies con nuevos valores
function updateUTMCookies() {
    const newValues = determineTrafficSource();
    const cookieNames = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    cookieNames.forEach(name => {
        const newValue = newValues[name.replace('utm_', '')];
        const currentValue = getCookie(name);
        
        // Si hay un nuevo valor y es diferente al actual, actualizar
        if (newValue && newValue !== '(none)' && newValue !== currentValue) {
            setCookie(name, newValue);
        }
        // Si no hay valor actual, guardar el nuevo
        else if (!currentValue) {
            setCookie(name, newValue);
        }
    });
}

// Función para completar el formulario con valores de las cookies
function fillFormWithCookies(formId) {
    // Verificar si el formulario existe
    const form = document.getElementById(formId);
    if (!form) {
        console.warn(`Formulario con ID "${formId}" no encontrado`);
        return;
    }

    const cookieNames = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    cookieNames.forEach(name => {
        const value = getCookie(name);
        if (value) {
            const input = form.querySelector(`[name="${name}"]`);
            // Solo actualizar si el input existe
            if (input) {
                input.value = value;
            }
        }
    });
}

// Función principal que se ejecuta al cargar la página
function initializeUTMTracking(formId) {
    // Verificar si se proporcionó un ID de formulario
    if (!formId) {
        console.warn('Se requiere el ID del formulario para inicializar el seguimiento UTM');
        return;
    }

    // Actualizar cookies con nuevos valores
    updateUTMCookies();
    
    // Completar el formulario con valores de las cookies
    fillFormWithCookies(formId);
}

// Ejemplo de uso en el HTML:
// <script>
//     document.addEventListener('DOMContentLoaded', function() {
//         initializeUTMTracking('miFormulario');
//     });
// </script>