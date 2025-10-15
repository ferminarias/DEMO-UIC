document.addEventListener('DOMContentLoaded', function() {
    
    // Seleccionar todos los formularios con el ID WebToLeadForm
    const forms = document.querySelectorAll('#WebToLeadForm');
    
    // Aplicar la lógica a cada formulario encontrado
    forms.forEach(function(form) {
        // Buscar el campo de teléfono dentro de este formulario específico
        const phoneInput = form.querySelector('#phone_work');
        
        // Si no existe el campo de teléfono en este formulario, saltar al siguiente
        if (!phoneInput) return;
        
        // Validación para el campo de teléfono - solo permitir números
        phoneInput.addEventListener('input', function(e) {
            // Reemplazar cualquier carácter que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limitar a 10 dígitos
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
        
        // Validación adicional al enviar el formulario
        form.addEventListener('submit', function(event) {
            const phoneValue = phoneInput.value.trim();
            
            // Verificar que el teléfono tenga exactamente 10 dígitos
            if (phoneValue.length !== 10 || !/^\d{10}$/.test(phoneValue)) {
                event.preventDefault();
                alert('Por favor ingresa exactamente 10 dígitos numéricos en el campo de teléfono.');
                phoneInput.focus();
                return false;
            }
        });
    });
});