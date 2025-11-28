/// Menu
import React, { useContext,useEffect,useReducer, useState } from "react";
import {Modal, Collapse} from 'react-bootstrap';
/// Scroll
import PerfectScrollbar from "react-perfect-scrollbar";
/// Link
import { Link } from "react-router-dom";
import {useScrollPosition} from "@n8tb1t/use-scroll-position";
import {MenuList} from './Menu';
import { ThemeContext } from "../../../context/ThemeContext";

const reducer = (previousState, updatedState) => ({
  ...previousState,
  ...updatedState,
});

const initialState = {
  active : "",
  activeSubmenu : "",
}


const SideBar = () => {
	var d = new Date();
	const [newProject ,setNewProject] = useState(false);
  const {
    iconHover,
    sidebarposition,
    headerposition,
    sidebarLayout,
    ChangeIconSidebar
  } = useContext(ThemeContext);
  const [state, setState] = useReducer(reducer, initialState);	

  const [btnHeart, setBtnHeart] = useState();
  
  // For scroll
	const [hideOnScroll, setHideOnScroll] = useState(true)
	useScrollPosition(
		({ prevPos, currPos }) => {
		  const isShow = currPos.y > prevPos.y
		  if (isShow !== hideOnScroll) setHideOnScroll(isShow)
		},
		[hideOnScroll]
	)
	

  const handleMenuActive = status => {		
		setState({active : status});			
		if(state.active === status){				
			setState({active : ""});
		}   
	}
	const handleSubmenuActive = (status) => {		
		setState({activeSubmenu : status})
		if(state.activeSubmenu === status){
			setState({activeSubmenu : ""})			
		}    
	}
  
  
  /// Path
  let path = window.location.pathname;
  path = path.split("/");
  path = path[path.length - 1];  

  useEffect(() => {
    MenuList.forEach((data) => {
      data.content?.forEach((item) => {
        if (path === item.to) {
          setState({ active: data.title })
        }
        item.content?.forEach(ele => {
          if (path === ele.to) {
            setState({ activeSubmenu: item.title, active: data.title })
          }
        })
      })
    })
  }, [path]);


  return (
    <div
      onMouseEnter={()=>ChangeIconSidebar(true)}
      onMouseLeave={()=>ChangeIconSidebar(false)}
      className={`deznav ${iconHover} ${
        sidebarposition.value === "fixed" &&
        sidebarLayout.value === "horizontal" &&
        headerposition.value === "static"
          ? hideOnScroll > 120
            ? "fixed"
            : ""
          : ""
      }`}
    >
	      <Link to={"#"} className="add-project-sidebar btn btn-primary" onClick={()=>setNewProject(true)}>+ New Project</Link>
        <PerfectScrollbar className="deznav-scroll">
          <ul className="metismenu" id="menu">              
              {MenuList.map((data, index)=>{
                let menuClass = data.classsChange;
                  if(menuClass === "menu-title"){
                    return(
                        <li className={menuClass}  key={index} >{data.title}</li>
                    )
                  }else{
                    return(				
                      <li className={` ${ state.active === data.title ? 'mm-active' : ''} ${data.to === path ? 'mm-active' : ''}`}
                        key={index} 
                      >                        
                        {data.content && data.content.length > 0 ?
                          <>
                            <Link to={"#"} 
                              className="has-arrow"
                              onClick={() => {handleMenuActive(data.title)}}
                            >								
								                {data.iconStyle}{" "}
                                <span className="nav-text">{data.title}</span>
                            </Link>
                        
                            <Collapse in={state.active === data.title ? true :false}>
                              <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`}>
                                {data.content && data.content.map((data,index) => {									
                                  return(	
                                      <li key={index}
                                        className={`${ state.activeSubmenu === data.title ? "mm-active" : ""} ${data.to === path ? 'mm-active' : ''}`}                                    
                                      >
                                        {data.content && data.content.length > 0 ?
                                            <>
                                              <Link to={data.to} className={data.hasMenu ? 'has-arrow' : ''}
                                                onClick={() => { handleSubmenuActive(data.title)}}
                                              >
                                                {data.title}
                                              </Link>
                                              <Collapse in={state.activeSubmenu === data.title ? true :false}>
                                                  <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`}>
                                                    {data.content && data.content.map((data,index) => {
                                                      return(	                                                    
                                                        <li key={index}>
                                                          <Link className={`${path === data.to ? "mm-active" : ""}`} to={data.to}>{data.title}</Link>
                                                        </li>
                                                        
                                                      )
                                                    })}
                                                  </ul>
                                              </Collapse>
                                            </>
                                          :
                                          <Link to={data.to} className={`${data.to === path ? 'mm-active' : ''}`}>
                                            {data.title}
                                          </Link>
                                        }
                                        
                                      </li>
                                    
                                  )
                                })}
                              </ul>
                            </Collapse>
                          </>
                          :
                          <Link  to={data.to} className={`${data.to === path ? 'mm-active' : ''}`}>
                            {data.iconStyle}
                            <span className="nav-text">{data.title}</span>
                          </Link>
                        }
                      </li>	
                    )
                }
              })}          
          </ul>	
          <div className="copyright">
            <p><strong>Fasto React Admin Dashboard</strong> © {d.getFullYear()} All Rights Reserved</p>
            <p className="fs-12">Made with 
              <span className={`heart ${ btnHeart ? 'heart-blast' : ''}`}
                onClick={()=>setBtnHeart(!btnHeart)}
              ></span> 
              by DexignZone</p>
          </div>
        </PerfectScrollbar>      	
        <Modal className="modal fade" id="addProjectSidebar" show={newProject} onHide={setNewProject} centered>       
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create Project</h5>
              <button type="button" className="btn close" onClick={() => setNewProject(false)}><span>×</span></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label className="text-black font-w500">Project Name</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="text-black font-w500">Deadline</label>
                  <input type="date" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="text-black font-w500">Client Name</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="form-group">
                  <button type="button" className="btn btn-primary">CREATE</button>
                </div>
              </form>
            </div>
          </div>       
      </Modal>
    </div>
  );
};

export default SideBar;
