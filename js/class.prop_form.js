/* 
 * Clase Prop
 *
 * Su funcion:
 *  - Crear, Modificar o Eliminar propiedades
 *  - Destaca prop o elimina prop destacadas.
 * 
 */

var Prop = new (function(){

    /* PUBLIC METHODS
     **************************************************************************/
    this.initializer = function(mode){
       mode_edit = mode;

       f = $('#formProp')[0];

       var thumbs = $('a.jq-thumb');
       if( thumbs.length>0 ){
           if( !mode_edit ) thumbs.show();
           $('input.jq-uploadinput').bind('keypress', function(e){e.preventDefault();});
       }

        $.validator.setting('#formProp .validate', {
            effect_show     : 'slidefade',
            validateOne     : true
        });
        $("#txtAddress, #txtDesc, #cboCategory, #cboCountry, #cboStates, #txtCity").validator({
            v_required  : true
        });

        $('a.jq-thumb').fancybox();
        AjaxUpload.initializer();
        popup.initializer();
   };

    this.save = function(){
        if( working ) return false;

        ajaxloader.show('Validando Formulario.');

        $.validator.validate('#formProp .validate', function(error){
            if( !error && validServices() && validImages() ){
                                
                var propid = $(f.prop_id).val();

                $.ajax({
                    type : 'post',
                    url  : baseURI+'paneluser/propiedades/ajax_check/',
                    data : {
                        address : f.txtAddress.value,
                        propid  : propid
                    },
                    success : function(data){
                        if( data=="exists" ){
                            show_error(f.txtAddress, 'La direcci&oacute;n ingresada ya existe.')
                            
                        }else if( data=="notexists" ){
                            ajaxloader.show('Enviando Formulario.');

                            var extra_post = {};

                            if( !mode_edit ){
                                extra_post.images_new = $('input.jq-uploadinput:not(empty)').toArrayValue();
                            }else{
                               //Busca Imagenes Nuevas
                               $('a.jq-thumbnew:visible').each(function(){
                                   var val = $(this).parent().find('input.jq-uploadinput').val();
                                   if( val!="" ) arr_images_new.push(val);
                               });

                               extra_post.images_new = arr_images_new;
                               extra_post.images_delete = arr_images_delete;
                               extra_post.images_modified_id = arr_images_modified.id;
                               extra_post.images_modified_name = arr_images_modified.name;
                            }

                            extra_post.services = $("#listServices").find("li input:checked").toArrayValue();

                            f.extra_post.value = json_encode(extra_post);
                            f.action = (propid=="") ? baseURI+"paneluser/propiedades/create" : baseURI+"paneluser/propiedades/edit/"+propid;
                            f.submit();

                        }else alert("ERROR:\n"+data);

                        if( data!="notexists" ) ajaxloader.hidden();
                    },
                    error : function(result){
                        alert("ERROR:\n"+result.responseText);
                    }
                })

            }else ajaxloader.hidden();
        });
        return false;
    };

    this.append_row_file = function(el){
        if( working ) return false;
        working=true;
        
        var total_img = $('input.jq-uploadinput:not(empty)').length;

        $.get(baseURI+'paneluser/propiedades/ajax_check_total_images/'+total_img, function(data){
           if( data=="limitexceeded" ){
               alert('Ha superado el limite para cargar imagenes.');
           }else if( data=="accesdenied" ){
               alert('Estimado usuario, le informamos que el servicio gratuito que usted dispone, le permite cargar un maximo de tres imágenes.\nEn caso que desee cargar mas imágenes, debera obtener una "Cuenta Plus"');
           }else if( data=="ok" ){
                var divRow = $('<div class="clear span-16"></div>');
                var divCol = $('<div class="column-photo"></div>');
                var button = $('<div class="button-examin">Examinar</div>');
                var input  = $('<input type="text" name="" class="input-form float-left jq-uploadinput" value="" />');
                    input.bind('keypress', function(e){e.preventDefault();});

                divCol.append('<div class="ajaxloader2"><img src="images/ajax-loader.gif" alt="" />&nbsp;&nbsp;Subiendo Im&aacute;gen...</div>')
                      .append('<a href="#" class="append-right-small2 float-left hide jq-thumb jq-thumbnew" rel="group"><img src="" alt="" width="69" height="60" /></a>')
                      .append(input)
                      .append(button)
                      .append('<button type="button" class="button-small float-left" onclick="Prop.remove_row_file(this);">Eliminar</button>');

                divRow.append(divCol);

                $(el).parent().parent().before(divRow);
                AjaxUpload.append_input(button);
           }else{
               alert('ERROR\n'+data);
           }
           working=false;
        });

        return false;
    };

    this.remove_row_file = function(el, image_id){
        var filename = $(el).parent().find('input.jq-uploadinput').val();

        if( filename!="" ){
            if( confirm('¿Está seguro que desea quitar la imagen "'+filename+'"') ){
                $(el).parent().parent().remove();

                if( typeof image_id!="undefined" ) {
                    if( $.inArray(image_id, arr_images_delete)==-1 ){
                        arr_images_delete.push(image_id);
                    }

                    var key = $.inArray(image_id, arr_images_modified.id);
                    if( key!=-1 ){
                        arr_images_modified.id.unset_array(key);
                        arr_images_modified.name.unset_array(key);
                    }
                }
                $('a.jq-thumb').fancybox();
            }
            
        }else{
            $(el).parent().parent().remove();
        }
    };

    this.add_image_modified = function(id, name){
        if( $.inArray(id, arr_images_modified.id)==-1 ){
            arr_images_modified.id.push(id);
            arr_images_modified.name.push(name);
            if( $.inArray(id, arr_images_delete)==-1 ) arr_images_delete.push(id);
        }
    };

    this.show_states = function(el){
        el.disabled = true;
        $.get(baseURI+'paneluser/propiedades/ajax_show_states/'+el.value,'', function(data){
            $('#cboStates').empty()
                           .append(data);

            el.disabled = false;
        });
    };


    /* PRIVATE PROPERTIES
     **************************************************************************/
    var mode_edit=false;
    var working = false;
    var arr_images_modified = {
        id : Array(),
        name : Array()
    };
    var arr_images_new = new Array();
    var arr_images_delete = new Array();
    var f=false;

    /* PRIVATE METHODS
     **************************************************************************/
    var validServices = function(){
        if( $("#listServices").find("li input:checked").length == 0 ){
            show_error("#msgbox_services", "Seleccione al menos un servicio.", "#validator_msg_services");
            return false;
        }else $.validator.hide('#msgbox_services');
        return true;
    };

    var validImages = function(){
        if( $('a.jq-thumb:visible').length==0 ){
            show_error('#msgbox_images', 'Debe ingresar al menos una im&aacute;gen.', '#msgbox_images');
            return false;
        }else $.validator.hide('#msgbox_images');
        return true;
    };

    var ajaxloader = {
        show : function(msg){
            working=true;

            var html = '<div class="text-center">';
                html+= '<p>'+msg+'</p>';
                html+= '<img src="images/ajax-loader5.gif" alt="" />';
                html+= '</div>';

            popup.load({html : html}, {
                reload  : true,
                bloqEsc : true,
                effectClose : false
            });
        },
        hidden : function(){
            popup.close();
            working=false;
        }
    }

})();


var AjaxUpload = new ClassAjaxUpload({
    selector : 'div.button-examin',
    action   : baseURI+'ajax_upload',
    onSubmit : function(input, ext){
        if( !(ext && /^(jpg|png|jpeg|gif)$/.test(ext)) ){
            alert('Error: Solo se permiten imagenes');
            return false;
        } else {
            var divCol = $(input).parent().parent();
            divCol.find('div.button-examin, input.input-form, a.jq-thumb, button').hide();
            divCol.find('div.ajaxloader2').show();
            divCol.find('input.input-form').val(input.value);
        }
        return true;
    },
    onComplete : function(response, input){
        try{
            eval('var filename='+response);
        }catch(e){
            divCol.find('input.input-form').val('');
            alert(response);
            return false;
        }

        var divCol = $(input).parent().parent();

        divCol.find('div.ajaxloader2').hide();
        divCol.find('div.button-examin, input.input-form, button').show();

        var a = divCol.find('a.jq-thumb');
        var img = a.find(':first');
        img.attr('src', filename.thumb);
        a.attr('href', filename.complete);
        a.show();
        if( $(input).parent()[0].id ){
            Prop.add_image_modified(parseInt($(input).parent()[0].id.substr(1)), divCol.find('input.input-form').val());
        }
        a.fancybox();
    }
});