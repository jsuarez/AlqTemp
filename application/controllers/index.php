<?php if (!defined('BASEPATH')) exit('No direct script access allowed');
class Index extends Controller {

    /* CONSTRUCTOR
     **************************************************************************/
    function __construct(){
        parent::Controller();
        $this->load->helper('form');
        $this->load->helper('text');
        $this->load->model('search_model');
        $this->load->model('lists_model');
        $this->load->library('pagination');

        $this->load->library('dataview', array(
            'tlp_section'     =>  'frontpage/index_view.php',
            'tlp_title'       =>  TITLE_INDEX,
            'tlp_formextra'   =>  true,
            'comboCountry'    =>  $this->lists_model->get_country_search(array("0"=>"Pa&iacute;ses")),
            'comboCategory'   =>  $this->lists_model->get_category(array("0"=>"Categor&iacute;as")),
            'comboStates'     =>  $this->lists_model->get_states_search(array("0"=>"Estados / Provincias")),
            'comboCity'       =>  $this->lists_model->get_city_search(array("0"=>"Ciudades"))
        ));
        $this->_data = $this->dataview->get_data();

        $this->_count_per_page=3;
        $this->_offset = !is_numeric($this->uri->segment(3)) ? 0 : $this->uri->segment(3);
    }

    /* PRIVATE PROPERTIES
     **************************************************************************/
    private $_data;
    private $_count_per_page;
    private $_offset;

    /* PUBLIC FUNCTIONS
     **************************************************************************/
    public function index(){
        $this->display();
    }

    public function display($param=null){
        if( $param==null ){
            $param = array(
                'base_url'    => str_replace('.html', '', site_url('/index/display/page/')),
                'title'       => 'Alquileres Destacados',
                'searcher'    =>  false,
                'listProp'    => $this->search_model->last_properties($this->_count_per_page)
                //'listProp'    => $this->search_model->list_disting($this->_count_per_page, $this->_offset)
            );
        }

        $listSearches = $this->search_model->get_searches();

        $config['base_url'] = $param['base_url'];
        $config['total_rows'] = $param['listProp']['count_rows'];
        $config['per_page'] = $this->_count_per_page;
        $config['uri_segment'] = $this->uri->total_segments();
        $this->pagination->initialize($config);

        $this->_data = $this->dataview->set_data(array(
            'listProp'           =>  $param['listProp']['result'],
            'listSearches'       =>  $listSearches,
            'tlp_title_section'  =>  $param['title'],
            'searcher'           =>  $param['searcher']
        ));


        $this->load->view('template_frontpage_view', $this->_data);
    }

    public function searcher(){
        $searcher = $this->uri->uri_to_assoc(3, array('search', 'country', 'state', 'city', 'category', 'page'));
        
        if( !empty($searcher['page']) ){
            $seg = "index/searcher/";
            foreach( $searcher as $key=>$val ){
                if( $key!='page' && !empty($val) ){
                    $seg.=$key."/".$val."/";
                }
            }
            $seg.="page/";
        }else{
            $seg = $this->uri->uri_string()."/page/";
        }

        $base_url = str_replace(".html", "", site_url($seg));
        $listProp = $this->search_model->search($this->_count_per_page, $this->_offset, $searcher);

        $this->display(array(
            'base_url'    => $base_url,
            'title'       => 'Resultado de B&uacute;queda',
            'listProp'    => $listProp,
            'searcher'    => $searcher
        ));
    }

    public function casas(){
        $listProp = $this->search_model->search($this->_count_per_page, $this->_offset, array('category'=>1));
        $this->display(array(
            'base_url'    => str_replace(".html", "", site_url('/index/casas/page/')),
            'title'       => 'Casas',
            'listProp'    => $listProp,
            'searcher'    => false
        ));
    }
    public function departamentos(){
        $listProp = $this->search_model->search($this->_count_per_page, $this->_offset, array('category'=>3));
        $this->display(array(
            'base_url'    => str_replace(".html", "", site_url('/index/departamentos/page/')),
            'title'       => 'Departamentos',
            'listProp'    => $listProp,
            'searcher'    => false
        ));
    }
    public function cabanias(){
        $listProp = $this->search_model->search($this->_count_per_page, $this->_offset, array('category'=>2));
        $this->display(array(
            'base_url'    => str_replace(".html", "", site_url('/index/cabanias/page/')),
            'title'       => 'Caba&ntilde;as',
            'listProp'    => $listProp,
            'searcher'    => false
        ));
    }
    public function otros(){
        $listProp = $this->search_model->search($this->_count_per_page, $this->_offset, array('category'=>4));
        $this->display(array(
            'base_url'    => str_replace(".html", "", site_url('/index/otros/page/')),
            'title'       => 'Otros',
            'listProp'    => $listProp,
            'searcher'    => false
        ));
    }

}

?>