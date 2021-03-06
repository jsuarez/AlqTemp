/* 
 * Clase Prop
 *
 * Esta clase es llamada en el listado de propiedades
 * 
 */

var Prop = new (function(){

    /* PUBLIC METHODS
     **************************************************************************/
    this.action={
        edit : function(){
            var lstProp = $("#tblList tbody input:checked");
            if( lstProp.length==0 ){
                alert("Debe seleccionar una propiedad para modificar.");
                return true;
            }
            if( lstProp.length>1 ){
                alert("Debe seleccionar una sola propiedad.");
                return false;
            }
            location.href = baseURI+'paneluser/propiedades/form/'+lstProp.val();
            return false;
        },

        del : function(){
            var lstProp = $("#tblList tbody input:checked");
            if( lstProp.length==0 ){
                alert("Debe seleccionar una propiedad.");
                return false;
            }
            
            var data = get_data(lstProp);

            if( confirm("¿Está seguro de eliminar la(s) propiedad(es) seleccionada(s)?\n\n"+data.names.join(", ")) ){
                location.href = baseURI+'paneluser/propiedades/delete/'+data.id.join("/");
            }
            return false;
        }
    };


    /* PRIVATE PROPERTIES
     **************************************************************************/

    /* PRIVATE METHODS
     **************************************************************************/
    var get_data = function(arr){
        var names = [], id = [];

        arr.each(function(i){
            id.push(this.value);
            names.push($(this).parent().parent().find('.cell-3').text());
        });

        return {
            id    : id,
            names : names
        }
    };

})();