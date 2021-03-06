/* 
 * Clase Contact
 *
 * Su funcion: Envia formulario de contacto
 *
 */

var Contact = new (function(){

    /* PUBLIC METHODS
     **************************************************************************/
     this.initializer = function(){
        f = $('#formContact')[0];
        $.validator.setting('#formContact .validate', {
            effect_show     : 'slidefade',
            validateOne     : true,
            addClass        : 'float-left'
        });

        $(f.txtName).validator({
            v_required  : true
        });
        $(f.txtEmail).validator({
            v_required  : true,
            v_email     : true
        });
        $(f.txtConsult).validator({
            v_required  : true
        });

     };

     this.send = function(){
        if( working ) return false;
        working=true;

        $.validator.validate('#formContact .validate', function(error){
             if( !error ){
                 f.submit();
             }else working=false;
         });         

         return false;
     };

    /* PRIVATE PROPERTIES
     **************************************************************************/
     var f=false;
     var working=false;

})();
