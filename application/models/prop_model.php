<?php if (!defined('BASEPATH')) exit('No direct script access allowed');
class Prop_model extends Model {

    /* CONSTRUCTOR
     **************************************************************************/
    function  __construct() {
        parent::Model();
    }

    /* PUBLIC FUNCTIONS
     **************************************************************************/
    public function create($data = array()) {
        $images_new = $data['extra_post']->images_new;
        $services = $data['extra_post']->services;

        unset($data['extra_post']);

        $this->db->trans_start(); // INICIO TRANSACCION

        // INSERTA LOS DATOS DE LA PROPIEDAD
        if( !$this->db->insert(TBL_PROPERTIES, $data) ) {
            display_error(__FILE__, "create", ERR_DB_INSERT, array(TBL_PROPERTIES));
        }

        $prop_id = $this->db->insert_id();

        // INSERTA LOS SERVICIOS
        $this->_create_servprop($services, $prop_id);

        // COPIA LAS IMAGENES NUEVAS
        $data = $this->_copy_images($images_new, $prop_id);
        if( !$data ) return false;

        // GUARDA LAS IMAGENES EN LA BASE DE DATO
        foreach( $data as $dat ){
            if( !$this->db->insert(TBL_IMAGES, $dat) ) {
                display_error(__FILE__, "create", ERR_DB_INSERT, array(TBL_IMAGES));
            }
        }

        // ELIMINA LAS IMAGENES TEMPORALES DEL USUARIO
        delete_images_temp();
        
        $this->db->trans_complete(); // COMPLETO LA TRANSACCION

        return "ok";
    }

    public function edit($data = array(), $prop_id=null) {
        if( !is_numeric($prop_id) ) return false;

        $services = $data['extra_post']->services;
        $images_new = $data['extra_post']->images_new;
        $images_deletes = $data['extra_post']->images_delete;
        $images_modified_id = $data['extra_post']->images_modified_id;
        $images_modified_name = $data['extra_post']->images_modified_name;

        unset($data['extra_post']);

        $this->db->trans_start(); // INICIO TRANSACCION

        // MODIFICA LOS DATOS DE LA PROPIEDAD
        $this->db->where('prop_id', $prop_id);
        if( !$this->db->update(TBL_PROPERTIES, $data) ) {
            display_error(__FILE__, "update", ERR_DB_UPDATE, array(TBL_PROPERTIES));
        }

        // ELIMINA E INSERTA LOS SERVICIOS
        if( !$this->db->delete(TBL_PROPERTIES_SERVS, array('prop_id'=>$prop_id)) ){
            display_error(__FILE__, "update", ERR_DB_DELETE, array(TBL_PROPERTIES_SERVS));
        }

        // INSERTA LOS SERVICIOS
        $this->_create_servprop($services, $prop_id);

        // ELIMINA IMAGENES
        foreach( $images_deletes as $image_id ){
            echo $image_id."<br>";
            $row = $this->db->query("SELECT name, name_thumb FROM ". TBL_IMAGES ." WHERE image_id=".$image_id)->row_array();

            @unlink(UPLOAD_DIR.$row['name']);
            @unlink(UPLOAD_DIR.$row['name_thumb']);

            if( count($images_modified_id)==0 ){
                if( !$this->db->delete(TBL_IMAGES, array('image_id'=>$image_id)) ){
                    display_error(__FILE__, "update", ERR_DB_DELETE, array(TBL_IMAGES));
                }
            }
        }

        // COPIA LAS IMAGENES NUEVAS
        if( count($images_new)>0 ){
            $data = $this->_copy_images($images_new, $prop_id);
            if( !$data ) return false;

            // GUARDA LAS IMAGENES EN LA BASE DE DATO
            foreach( $data as $dat ){
                if( !$this->db->insert(TBL_IMAGES, $dat) ) {
                    display_error(__FILE__, "update", ERR_DB_INSERT, array(TBL_IMAGES));
                }
            }
        }

        // COPIA Y MODIFICA LAS IMAGENES
        if( count($images_modified_name)>0 ){
            $data = $this->_copy_images($images_modified_name, $prop_id);
            if( !$data ) return false;

            // MODIFICA LAS IMAGENES EN LA BASE DE DATO
            foreach( $images_modified_id as $image_id ){
                $dat = current($data);
                unset($dat['prop_id']);
                $this->db->where('image_id', $image_id);

                if( !$this->db->update(TBL_IMAGES, $dat) ) {
                    display_error(__FILE__, "update", ERR_DB_UPDATE, array(TBL_IMAGES));
                }
                next($data);
            }
        }

        // ELIMINA LAS IMAGENES TEMPORALES DEL USUARIO
        delete_images_temp();

        $this->db->trans_complete(); // COMPLETO LA TRANSACCION
        return "ok";
    }

    public function delete($prop_id) {

        // ELIMINA LAS IMAGENES
        $this->db->select('name, name_thumb');
        $this->db->where_in("prop_id", $prop_id);
        $query = $this->db->get(TBL_IMAGES);

        foreach( $query->result_array() as $row ){
            @unlink(UPLOAD_DIR.$row['name']);
            @unlink(UPLOAD_DIR.$row['name_thumb']);
        }

        $this->db->trans_start(); // INICIO TRANSACCION

        // ELIMINA DATOS EN (properties, properties_to_services, properties_disting, images, log_searches)
        if( !$this->db->query('DELETE FROM '.TBL_PROPERTIES.' WHERE prop_id in('. implode(",", $prop_id) .')') ){
            display_error(__FILE__, "delete", ERR_DB_DELETE, array(TBL_PROPERTIES));
        }
        if( !$this->db->query('DELETE FROM '.TBL_PROPERTIES_SERVS.' WHERE prop_id in('. implode(",", $prop_id) .')') ){
            display_error(__FILE__, "delete", ERR_DB_DELETE, array(TBL_PROPERTIES_SERVS));
        }
        if( !$this->db->query('DELETE FROM '.TBL_PROPERTIES_DISTING.' WHERE prop_id in('. implode(",", $prop_id) .')') ){
            display_error(__FILE__, "delete", ERR_DB_DELETE, array(TBL_PROPERTIES_DISTING));
        }
        if( !$this->db->query('DELETE FROM '.TBL_IMAGES.' WHERE prop_id in('. implode(",", $prop_id) .')') ){
            display_error(__FILE__, "delete", ERR_DB_DELETE, array(TBL_IMAGES));
        }

        $this->db->trans_complete(); // COMPLETO LA TRANSACCION

        return true;
    }

    public function exists($address, $prop_id=''){
        if( $prop_id=="" ){
            $where = array('address'=>$address);
        }else{
            $where = array('prop_id <>'=>$prop_id, 'address'=>$address);
        }
        $result = $this->db->get_where(TBL_PROPERTIES, $where);
        return $result->num_rows==0 ? false : true;
    }

    public function get_service_associate($prop_id){
        $this->db->select(TBL_SERVICES.'.service_id');
        $this->db->select(TBL_SERVICES.'.name');
        $this->db->join(TBL_PROPERTIES_SERVS, TBL_SERVICES.'.service_id = '. TBL_PROPERTIES_SERVS .'.service_id');
        return $this->db->get_where(TBL_SERVICES, array('prop_id'=>$prop_id))->result_array();
    }

    public function get_list_prop($where=array()){
        $sql = "prop_id, address,";
        $sql.= "(SELECT name FROM ".TBL_CATEGORY." WHERE category_id=".TBL_PROPERTIES.".category_id) as category,";
        $sql.= "(SELECT CONCAT('".substr(UPLOAD_DIR,2)."',name_thumb) FROM ". TBL_IMAGES ." WHERE ". TBL_IMAGES .".prop_id=". TBL_PROPERTIES .".prop_id LIMIT 1) as image";
        $this->db->select($sql, false);
        $this->db->where("user_id", $this->session->userdata('user_id'));
        $this->db->where($where);
        $this->db->order_by('prop_id', 'desc');
        $this->db->order_by('address', 'asc');
        return $this->db->get(TBL_PROPERTIES);
    }
    public function get_list2_prop($user_id=null){
        $sql = TBL_PROPERTIES.".prop_id,";
        $sql.= TBL_PROPERTIES.".address,";
        $sql.= "date_format(" .TBL_PROPERTIES. ".date_added, '%d-%m-%Y %H:%i:%s') as date_added,";
        $sql.= "date_format(" .TBL_PROPERTIES. ".last_modified, '%d-%m-%Y %H:%i:%s') as last_modified,";
        $sql.= TBL_USERS.".user_id,";
        $sql.= TBL_USERS.".username";
        $this->db->select($sql, false);
        $this->db->from(TBL_PROPERTIES);
        $this->db->join(TBL_USERS, TBL_PROPERTIES.'.user_id = '.TBL_USERS.'.user_id');
        if( $user_id!=null ) $this->db->where("user_id", $user_id);
        $this->db->group_by('username');
        $this->db->order_by('prop_id', 'desc');
        $this->db->order_by('address', 'asc');
        $this->db->order_by('username', 'asc');
        return $this->db->get();
    }

    public function get_prop($prop_id){
        if( !is_numeric($prop_id) ) {
            //There was a problem
            return false;
        }
        $query = $this->db->get_where(TBL_PROPERTIES, array('prop_id'=>$prop_id));

        $service_id = array();
        $data = array();
        $data = $query->row_array();

        $data['services'] = $this->get_service_associate($prop_id);
        $data['images'] = $this->get_images($prop_id);

        return $data;
    }

    public function get_images($prop_id){
        if( !is_numeric($prop_id) ) {
            //There was a problem
            return false;
        }
        $sql = "image_id,";
        $sql.= "CONCAT('".substr(UPLOAD_DIR,2)."',name) as name,";
        $sql.= "CONCAT('".substr(UPLOAD_DIR,2)."',name_thumb) as name_thumb,";
        $sql.= "name_original";

        $this->db->select($sql, false);
        $this->db->where('prop_id', $prop_id);
        return $this->db->get(TBL_IMAGES);
    }

    public function get_info_prop($id){
        $this->db->select(TBL_USERS.'.email, '.TBL_PROPERTIES.'.address', false);
        $this->db->from(TBL_USERS);
        $this->db->join(TBL_PROPERTIES, TBL_USERS.'.user_id = '.TBL_PROPERTIES.'.user_id');
        $this->db->where(TBL_PROPERTIES.'.prop_id', $id);
        $query = $this->db->get();
        return $query->row_array();
    }

    public function get_total_prop(){
        $this->db->where("user_id", $this->session->userdata('user_id'));
        $query = $this->db->get(TBL_PROPERTIES);
        return $query->num_rows;
    }


    /* PRIVATE FUNCTIONS
     **************************************************************************/
     private function _create_servprop($services, $prop_id){
        $sql = "INSERT INTO ".TBL_PROPERTIES_SERVS."(prop_id,service_id) VALUES ";
        foreach ( $services as $service ){
            $sql.="(";
            $sql.= $prop_id.",".$service."),";
        }
        $sql = substr($sql,0,-1);
        if( !$this->db->query($sql) ){
            display_error(__FILE__, "create_servprop", ERR_DB_INSERT, array(TBL_PROPERTIES_SERVS));
        }
        return true;
     }

     private function _copy_images($images_new, $prop_id){
        $user_id = $this->session->userdata('user_id');
        $prefix = $user_id."_";
        $data = array();

        foreach( $images_new as $name_original ){
            $name = preg_replace("/\s+/", "_", strtolower($name_original));


            $filesource = file_search_special(UPLOAD_DIR_TMP, $name);

            if( $filesource ){
                $filename_dest = $prefix.$name;
                $partf = part_filename($name);

                $n=0;
                while( file_exists(UPLOAD_DIR.$filename_dest) ){
                    $n++;
                    $partf2 = part_filename($filename_dest);
                    $filename_dest = $partf2['basename']."_copy".$n.".".$partf2['ext'];

                    $partf3 = part_filename($name_original);
                    $name_original = $partf3['basename']."_copy".$n.".".$partf3['ext'];
                }

                if( !@copy($filesource, UPLOAD_DIR.$filename_dest) ){
                    display_error(__FILE__, "copy_images", ERR_PROP_COPY_FAILD, array(UPLOAD_DIR.$filename_dest));
                }

                if( $n==0 ){
                    $filename_thumb_dest = $prefix.$partf['basename']."_thumb.".$partf['ext'];
                }else{
                    $filename_thumb_dest = $partf2['basename']."_copy".$n."_thumb.".$partf2['ext'];
                }

                $filesource = str_replace($name, "", $filesource);
                if( !@copy($filesource.$partf['basename']."_thumb.".$partf['ext'], UPLOAD_DIR.$filename_thumb_dest) ){
                    display_error(__FILE__, "copy_images", ERR_PROP_COPY_FAILD, array(UPLOAD_DIR.$filename_thumb_dest));
                }

                $data[] = array(
                    'name'=>$filename_dest,
                    'name_thumb'=>$filename_thumb_dest,
                    'name_original'=>$name_original,
                    'prop_id'=>$prop_id
                );

            }else{
                display_error(__FILE__, "copy_images", ERR_PROP_IMAGE_NONEXISTENT, array(UPLOAD_DIR_TMP, $name));
            }
        }

        return $data;
     }

}
?>