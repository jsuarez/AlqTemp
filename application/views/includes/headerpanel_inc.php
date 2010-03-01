    <div class="top_left">
        <div class="logo"><a href="<?=site_url('/');?>" target="_blank"><img src="images/logo_alquilerestemp.png" alt="www.alquilerestemporarios.org" /></a></div>
    </div>

    <div class="top_right">
        <div class="registro">
            <div class="header-menu-cell1">
                <a href="<?=site_url('/');?>" class="link2"><img src="images/icono_inicio.png" alt="" /> Inicio</a>
                <a href="<?=site_url('/contacto/');?>" class="link2"><img src="images/icono_contacto.png" alt="" /> Contacto</a>
            </div>
            
            <div class="header-menu-cell3">
                <span class="title2">Usuario:&nbsp;</span> <span class="title1"><?=$this->session->userdata('name');?></span>
            </div>
            <div class="header-menu-salir">
                <a href="<?=site_url('/login/logout/');?>" class="button1">Salir</a>
            </div>
        </div>
    </div>

    <div class="column_panel">
        <div class="menu_panel">
            <ul>
                <li><a href="<?=site_url('/micuenta/');?>">Mi Cuenta</a></li>
                <li><a href="<?=site_url('/prop/');?>">Propiedades</a></li>
                <li><a href="<?=site_url('/destacarme/');?>">Destacar</a></li>
                <li><a href="<?=site_url('/cuentaplus/');?>">Cuenta Plus</a></li>
                <li><a href="<?=site_url('/agregarfondos/');?>">Agregar Fondos</a></li>
            </ul>
        </div>
    </div>
