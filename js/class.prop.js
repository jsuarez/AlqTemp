/* 
 * Clase 
 * 
 */

var Prop = new (function(){

    /*
     * PUBLIC METHODS
     */
    this.initializer = function(){
        f = $('#formProp')[0];

        $.validator.setting('#formAccount .validate', {
            effect_show     : 'slide',
            validateOne     : true
        });

        $(f.txtName).validator({
            v_required  : true
        });
    };


    this.save = function(){
        if( working ) return false;

        ValidatorProp.validate(function(error){
            if( !error && validServices() && validImages() ){
                working=true;
                var propid="";

                if( f.prop_id.value!="" ) propid = "/"+f.prop_id.value;

                $('#ajaxloader').show();
                $.get(baseURI+'ajax_prop/valid/'+escape(f.txtAddress.value)+propid, function(data){
                    if( data=="exists" ){
                        if( $('#contmessage').is(':hidden') ){
                            $('#contmessage').html('La propiedad ingresada ya existe.');
                            $('#contmessage').slideToggle('slow');
                        }
                        $('#ajaxloader').hide();
                        working=false;
                    }else{
                        var servsel="";
                        checkServ.each(function(){
                            servsel+=this.value+",";
                        });
                        servsel = servsel.substr(0, servsel.length-1);

                        if( f.prop_id.value=="" ){
                            f.images_new.value = arrayToObject($('input.ajaxupload-input:not(empty)'));
                        }else{
                           //Busca Imagenes Nuevas
                           $('a.ajaxupload-preview:visible').each(function(){
                               var val = $(this).parent().find('.ajaxupload-input').val();
                               if( val!="" ) arr_images_new.push();
                           });

                           f.images_new.value = arrayToObject(arr_images_new);
                           f.images_deletes.value = arrayToObject(arr_images_delete);
                           f.images_modified_id.value = arrayToObject(arr_images_modified.id);
                           f.images_modified_name.value = arrayToObject(arr_images_modified.name);
                        }

                        f.services.value = servsel;
                        f.action = (propid=="") ? baseURI+"prop/create" : baseURI+"prop/edit"+propid;
                        f.submit();
                    }
                });

            }else{
                alert('Se han encontrado errores.\nPor favor, revise el formulario.');
            }
        });
        return false;
    };


    this.action={
        edit : function(){
            var lstProp = $("#tblProp .table_left input:checked");
            if( lstProp.length==0 ){
                alert("Debe seleccionar una propiedad para modificar.");
                return false;
            }
            if( lstProp.length>1 ){
                alert("Debe seleccionar una sola propiedad.");
                return false;
            }
            location.href = baseURI+'prop/form/'+lstProp.val();
            return false;
        },

        del : function(){
            var lstProp = $("#tblProp .table_left input:checked");
            if( lstProp.length==0 ){
                alert("Debe seleccionar una propiedad.");
                return false;
            }
            
            var data = get_data(lstProp);

            if( confirm("¿Está seguro de eliminar la(s) propiedad(es) seleccionada(s)?\n\n"+data.names) ){
                location.href = baseURI+'prop/delete/'+data.id;
            }

            return false;
        },

        disting : function(dist, sel, credit, user_credit){
            var lstProp = $(sel+" input:checked");
            if( lstProp.length==0 ){
                alert("Debe seleccionar una propiedad.");
                return false;
            }

            var newcredit = user_credit - (credit*lstProp.length);

            if( newcredit<=0 ){
                alert("No tiene suficiente credito para destacar.")
                return false;
            }

            var data = get_data(lstProp);

            location.href = baseURI+"destacarme/disting/"+data.id+"/"+dist;

            return false;
        }
    }

    this.append_row_file = function(el){
        var divRow = $('<div class="row"></div>');
        var divCol = $('<div class="col"></div>');
        var button = $('<div class="button2 float-left btnexamin">Examinar</div>');
        var input  = $('<input type="text" name="" class="input style_input float-left ajaxupload-input" value="" />');
            input.bind('keypress', function(e){e.preventDefault();});

        divCol.append('<div class="ajaxloader2"><img src="images/ajax-loader.gif" alt="" />&nbsp;&nbsp;Subiendo Im&aacute;gen...</div>')
              .append('<a href="#" class="previewthumb ajaxupload-preview"><img src="" alt="" width="69" height="60" /></a>')
              .append(input)
              .append(button)
              .append('<a class="button2 float-left" onclick="Prop.remove_row_file(this); return false;">Eliminar</a>');
              
        divRow.append(divCol);

        $(el).parent().before(divRow);
        AjaxUpload.append_input(button);
    };

    this.remove_row_file = function(el, image_id){
        var filename = $(el).parent().find('.ajaxupload-input').val();

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



    /*
     * PRIVATE PROPERTIES
     */
    var checkServ;
    var working = false;
    var arr_images_modified = {
        id : Array(),
        name : Array()
    };
    var arr_images_new = new Array();
    var arr_images_delete = new Array();
    var f=false;

    /*
     * PRIVATE METHODS
     */
    var validServices = function(){
        checkServ = $("#lstServices").find("li input:checked");
        if( checkServ.length == 0 ){
            ValidatorProp.message.hidden("#formProp .validate");
            ValidatorProp.message.show("#contServices", ['Seleccione al menos un servicio.']);
            return false;
        }
        return true;
    };

    var validImages = function(){
        if( $('a.previewthumb:visible').length==0 ){
            alert("Debe ingresar al menos una imágen.");
            return false;
        }
        return true;
    };

    var arrayToObject = function(arr){
        if( arr.length>0 ){
            var str="";
            var isObject = !($.isArray(arr));

            $(arr).each(function(i){
                var val = !isObject ? this : this.value;
                str+='"'+(i)+'":"'+val+'",';
            });
            str = str.substr(0, str.length-1);
            return "{"+str+"}";
        }
        return '';
    };

    var get_data = function(arr){
        var names="", id="";

        arr.each(function(i){
            id+=this.value+"/";
            names+= $(this).parent().parent().find('.table_center').html()+", ";
        });

        id = id.substr(0, id.length-1);
        names = names.substr(0, names.length-2);

        return {
            id   : id,
            names : names
        }
    }


    /*
     * CONSTRUCTOR
     */
    $(document).ready(function(){
       var p = $('.previewthumb');
       f = $('#formProp')[0];
       
       if( p.length>0 ){
           if( f.prop_id.value!="" ) {
               p.show();
           }

           $('input.ajaxupload-input').bind('keypress', function(e){e.preventDefault();});
       }
    });

})();




if( typeof ClassAjaxUpload!="undefined" ){
    var AjaxUpload = new ClassAjaxUpload({
        selector : '.btnexamin',
        action   : baseURI+'ajax_upload',
        onSubmit : function(input, ext){
            if( !(ext && /^(jpg|png|jpeg|gif)$/.test(ext)) ){
                alert('Error: Solo se permiten imagenes');
                return false;
            } else {
                var divCol = $(input).parent().parent();
                divCol.find('div.btnexamin, input.style_input').hide();
                divCol.find('div.ajaxloader2').show();
                divCol.find('input.style_input').val(input.value);
            }
            return true;
        },
        onComplete : function(response, input){
            var divCol = $(input).parent().parent();

            divCol.find('div.ajaxloader2').hide();
            divCol.find('div.btnexamin, input.style_input').show();

            if( /^(filename:)/.test(response) ){
                var filename = response.substr(9);
                var a = divCol.find('a.previewthumb');
                var img = a.find(':first');
                img.attr('src', filename);
                a.show();
                if( $(input).parent()[0].id ){
                    Prop.add_image_modified(parseInt($(input).parent()[0].id.substr(1)), divCol.find('input.style_input').val());
                }
                

            }else{
                divCol.find('input.style_input').val('');
                alert(response);
            }

        }
    });
}
