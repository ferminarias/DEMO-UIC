
// SCRIPTS DEL MENÚ PRINCIPAL
$(document).ready(function(event){
	$('a.hamburger').click(function(event){
		event.preventDefault();
		$('.hamburger').toggleClass('isOpen');
		$('.menumobile').toggleClass('isOpen');
		$('body').toggleClass('isOpen');
		var delay = 200;
		setTimeout(function() {
			$('.headermobile').toggleClass('isOpen');
		}, delay);
	});

  $(".contmod ul").hide();

    $(".contmod button").click(function () {
    	$(this).next('ul').slideDown().siblings('ul').slideUp();
  });


  $('.tramite').click(function(event){
		event.preventDefault();
		$('.iniciopago').addClass('isOpen');
	});
	$('.close').click(function(event){
		event.preventDefault();
		$('.iniciopago').removeClass('isOpen');
	});



	var fechaini = 'PRÓXIMO INICIO: OCTUBRE';
	$('#espfecha').html(fechaini)

	var fechaini2 = "<span class='iconfont'>&#xe913;</span>&nbsp;&nbsp;Ocutbre 2025";
	$('.espfecha2').html(fechaini2)

	var fechalic = 'PRÓXIMO INICIO: OCTUBRE 2025';
	$('#esplic1').html(fechalic)

	var fechalic2 = "<span class='iconfont'>&#xe913;</span>&nbsp;&nbsp;Ocutbre 2025";
	$('.esplic2').html(fechalic2)
	
	var fechaini = 'PRÓXIMO INICIO: OCTUBRE 2025';
	$('#espfecha1').html(fechaini)

	// $('#Container').mixItUp();

});


// SMOOTH TRANSITION BETWEEN # LINKS

$('a[href*="#"]')
	  .not('[href="#"]')
	  .not('[href="#0"]')
	  .click(function(event) {
	    if (
	      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') 
	      && 
	      location.hostname == this.hostname
	    ) {
	      var target = $(this.hash);
	      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
	      if (target.length) {
	        event.preventDefault();
	        $('html, body').animate({
	          scrollTop: target.offset().top
	        }, 1000, function() {
	          var $target = $(target);
	          $target.focus();
	          if ($target.is(":focus")) { 
	            return false;
	          } else {
	            $target.attr('tabindex','-1'); 
	            $target.focus();
	          };
	        });
	      }
	    }
	  });
