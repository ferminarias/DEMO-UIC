// Función para manejar el cambio de país
function handleCountryChange(paisSelect) {
    const opcion = paisSelect.value;
    
    // Buscar elementos relacionados dentro del mismo formulario o contenedor
    const form = paisSelect.closest('form') || paisSelect.closest('div');
    const lada = form.querySelector('#lada');
    const tel = form.querySelector('#phone_work');
    const dial = form.querySelector('#dial_code');
    const estadoTxt = form.querySelector('#estado_txt');
    
    if (estadoTxt) {
        // Limpiar el valor del estado en cada cambio
        estadoTxt.value = '';
        
        if (opcion === 'México') {
            estadoTxt.parentElement.classList.remove('dnone');
            estadoTxt.setAttribute('required', 'required');
        } else {
            estadoTxt.parentElement.classList.add('dnone'); 
            estadoTxt.removeAttribute('required');
        }
    }
    
    const selectedOption = paisSelect.options[paisSelect.selectedIndex];
    const ladaValue = selectedOption.getAttribute('data-lada');
    
    if (lada) lada.value = ladaValue;
    if (dial) dial.value = ladaValue;
}

// Inicializar todos los selectores de país existentes
document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los elementos con id 'pais'
    const paisSelects = document.querySelectorAll('#pais');
    
    // Añadir event listener a cada uno
    paisSelects.forEach(function(paisSelect) {
        paisSelect.addEventListener('change', function() {
            handleCountryChange(this);
        });
        
        // Ejecutar una vez al cargar para establecer el estado inicial
        if (paisSelect.value) {
            handleCountryChange(paisSelect);
        }
    });
});