/**
 * Módulo de seguimiento UTM
 * Gestiona la captura, almacenamiento y uso de parámetros UTM
 */
const UTMTracker = (function() {
    // Constantes
    const COOKIE_EXPIRY_DAYS = 30;
    const UTM_PARAMS = {
        SOURCE: 'utm_source',
        MEDIUM: 'utm_medium',
        CAMPAIGN: 'utm_campaign',
        TERM: 'utm_term',
        CONTENT: 'utm_content'
    };
    const TRAFFIC_TYPES = {
        DIRECT: '(direct)',
        ORGANIC: '(organic)',
        REFERRAL: '(referral)',
        NONE: '(none)'
    };
    const SEARCH_ENGINES = [
        'google.com', 
        'bing.com', 
        'yahoo.com', 
        'yandex.com'
    ];

    /**
     * Establece una cookie con el nombre y valor especificados
     * @param {string} name - Nombre de la cookie
     * @param {string} value - Valor a almacenar
     * @param {number} days - Días de expiración
     */
    function setCookie(name, value, days = COOKIE_EXPIRY_DAYS) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `; expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value || ''}${expires}; path=/`;
    }

    /**
     * Obtiene el valor de una cookie por su nombre
     * @param {string} name - Nombre de la cookie
     * @returns {string|null} - Valor de la cookie o null si no existe
     */
    function getCookie(name) {
        const nameEQ = `${name}=`;
        const cookies = document.cookie.split(';');
        
        for (let cookie of cookies) {
            let c = cookie;
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length);
            }
        }
        
        return null;
    }

    /**
     * Obtiene un parámetro de la URL
     * @param {string} name - Nombre del parámetro
     * @param {string} [url=window.location.href] - URL a analizar
     * @returns {string|null} - Valor del parámetro o null si no existe
     */
    function getUrlParameter(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
        const results = regex.exec(url);
        
        if (!results) return null;
        if (!results[2]) return '';
        
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    /**
     * Determina si una URL pertenece a un motor de búsqueda
     * @param {string} url - URL a analizar
     * @returns {boolean} - Verdadero si es un motor de búsqueda
     */
    function isSearchEngine(url) {
        if (!url) return false;
        
        try {
            const hostname = new URL(url).hostname;
            return SEARCH_ENGINES.some(engine => hostname.includes(engine));
        } catch (e) {
            console.warn('Error al analizar URL del referrer:', e);
            return false;
        }
    }

    /**
     * Determina la fuente de tráfico basada en UTM y referrer
     * @returns {Object} - Objeto con los valores de fuente de tráfico
     */
    function determineTrafficSource() {
        const referrer = document.referrer;
        const utmSource = getUrlParameter(UTM_PARAMS.SOURCE);
        const utmMedium = getUrlParameter(UTM_PARAMS.MEDIUM);
        
        // Si hay parámetros UTM, usarlos
        if (utmSource) {
            return {
                source: utmSource,
                medium: utmMedium || TRAFFIC_TYPES.NONE,
                campaign: getUrlParameter(UTM_PARAMS.CAMPAIGN) || TRAFFIC_TYPES.NONE,
                term: getUrlParameter(UTM_PARAMS.TERM) || TRAFFIC_TYPES.NONE,
                content: getUrlParameter(UTM_PARAMS.CONTENT) || TRAFFIC_TYPES.NONE
            };
        }
        
        // Si no hay UTM, determinar por referrer
        if (!referrer) {
            return {
                source: TRAFFIC_TYPES.DIRECT,
                medium: TRAFFIC_TYPES.NONE,
                campaign: TRAFFIC_TYPES.NONE,
                term: TRAFFIC_TYPES.NONE,
                content: TRAFFIC_TYPES.NONE
            };
        }
        
        if (isSearchEngine(referrer)) {
            return {
                source: TRAFFIC_TYPES.ORGANIC,
                medium: 'organic',
                campaign: TRAFFIC_TYPES.NONE,
                term: TRAFFIC_TYPES.NONE,
                content: TRAFFIC_TYPES.NONE
            };
        }
        
        return {
            source: TRAFFIC_TYPES.REFERRAL,
            medium: 'referral',
            campaign: TRAFFIC_TYPES.NONE,
            term: TRAFFIC_TYPES.NONE,
            content: TRAFFIC_TYPES.NONE
        };
    }

    /**
     * Actualiza las cookies con los valores UTM
     */
    function updateUTMCookies() {
        const trafficSource = determineTrafficSource();
        const utmParams = Object.values(UTM_PARAMS);
        
        console.log('UTMTracker: Actualizando cookies con fuente de tráfico:', trafficSource);
        
        utmParams.forEach(param => {
            const paramKey = param.replace('utm_', '');
            const newValue = trafficSource[paramKey];
            const currentValue = getCookie(param);
            
            const shouldUpdateCookie = 
                (newValue && newValue !== TRAFFIC_TYPES.NONE && newValue !== currentValue) || 
                !currentValue;
                
            if (shouldUpdateCookie) {
                setCookie(param, newValue);
                console.log(`UTMTracker: Cookie ${param} actualizada con valor: ${newValue}`);
            } else {
                console.log(`UTMTracker: Cookie ${param} mantiene valor actual: ${currentValue || 'no definido'}`);
            }
        });
    }

    /**
     * Completa un formulario con los valores de las cookies UTM
     * @param {string} formId - ID del formulario a completar
     */
    function fillFormWithCookies(formId) {
        const form = document.getElementById(formId);
        
        if (!form) {
            console.warn(`Formulario con ID "${formId}" no encontrado`);
            return;
        } 

        const utmParams = Object.values(UTM_PARAMS);
        
        utmParams.forEach(param => {
            const cookieValue = getCookie(param);
            
            if (!cookieValue) return;
            
            // Buscar el input por nombre exacto del parámetro UTM
            let input = form.querySelector(`[name="${param}"]`);
            
            // Si no existe un campo con el nombre exacto del parámetro UTM, 
            // buscar un campo con un nombre que contenga el parámetro sin el prefijo "utm_"
            if (!input) {
                const paramWithoutPrefix = param.replace('utm_', '');
                input = form.querySelector(`[name*="${paramWithoutPrefix}"]`);
            }
            
            if (input) {
                input.value = cookieValue;
                console.log(`Campo ${input.name} rellenado con valor: ${cookieValue}`);
            } else {
                // Crear un campo oculto si no existe
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = param;
                hiddenInput.id = param;
                hiddenInput.value = cookieValue;
                form.appendChild(hiddenInput);
                console.log(`Campo oculto ${param} creado con valor: ${cookieValue}`);
            }
        });
    }

    /**
     * Inicializa el seguimiento UTM
     * @param {string} formId - ID del formulario a completar
     */
    function initialize(formId) {
        if (!formId) {
            console.warn('Se requiere el ID del formulario para inicializar el seguimiento UTM');
            return;
        }

        console.log(`UTMTracker: Inicializando con formulario ID: ${formId}`);
        
        // Actualizar cookies UTM basadas en parámetros de URL o referrer
        updateUTMCookies();
        
        // Esperar a que el DOM esté completamente cargado antes de rellenar el formulario
        // Esto asegura que todos los elementos del formulario estén disponibles
        if (document.readyState === 'complete') {
            // Si el DOM ya está cargado, rellenar inmediatamente
            fillFormWithCookies(formId);
        } else {
            // Si el DOM aún no está cargado, esperar un momento
            setTimeout(() => {
                fillFormWithCookies(formId);
            }, 100);
        }
    }

    // API pública
    return {
        initialize,
        getTrafficSource: determineTrafficSource,
        getUTMParameter: param => getCookie(param)
    };
})();

// Uso:
// document.addEventListener('DOMContentLoaded', function() {
//     UTMTracker.initialize('WebToLeadForm');
// });