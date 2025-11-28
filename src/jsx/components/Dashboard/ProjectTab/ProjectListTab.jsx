import React,{Fragment} from 'react';
import {Link} from 'react-router-dom';
import {Tab, Nav} from 'react-bootstrap';

import {projectInfo, projectInfo2, projectInfo3, projectInfo4, 		
DropdownBlog} from '../../Fasto/Project/TabData';

const ProjectListTab = () => {
	
	return(
		<Fragment>
			<Tab.Container defaultActiveKey="All">
				<div className="project-nav">
					<div className="card-action card-tabs  me-auto">
						<Nav as="ul" className="nav nav-tabs style-2" id="ListViewTabLink" >
							<Nav.Item as="li">
								<Nav.Link to ={"#"} eventKey="All">All Projects
									<span className="ms-1 badge badge-pill shadow-primary badge-primary">8</span>
								</Nav.Link>
							</Nav.Item >
							<Nav.Item as="li">
								<Nav.Link to ={"#"} eventKey="Progress">On Progress
									<span className="ms-1 badge badge-pill badge-info shadow-info">4</span>
								</Nav.Link>
							</Nav.Item>
							<Nav.Item as="li">
								<Nav.Link to ={"#"} eventKey="Pending">Pending 
									<span className="ms-1 badge badge-pill badge-warning shadow-warning">2</span>
								</Nav.Link>
							</Nav.Item >
							<Nav.Item as="li">
								<Nav.Link to ={"#"} eventKey="Closed">Closed 
									<span className="ms-1 badge badge-pill badge-danger shadow-danger">2</span>
								</Nav.Link>
							</Nav.Item >
						</Nav>						
					</div>					
				</div>
				<Tab.Content className="project-list-group">
					<Tab.Pane eventKey="All">
						{projectInfo.map((item,index)=>(
							<div className="card" key={index}>
								<div className="project-info">
									<div className="col-xl-3 col-xxl-3 my-2 col-lg-4 col-sm-6">
										<p className="text-primary mb-2">{item.id}</p>
										<h4 className="title font-w600 mb-3"><Link to={"/post-details"} className="text-black">{item.title1}</Link></h4>
										<div className="text-dark"><i className="fa fa-calendar-o me-3" />Created on June 8th, 2024</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image1} alt="" />
											</div>
											<div className="ms-3">
												<span>Client</span>
												<h5 className="mb-0 pt-1 fs-18 font-w50 text-black">{item.title2}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image2} alt="" />
											</div>
											<div className="ms-3">
												<span>Person in charge</span>
												<h5 className="mb-0 pt-1 fs-18 font-w500 text-black">{item.title3}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-3 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="power-ic">
												<i className="fa fa-bolt" />
											</div>
											<div className="ms-3">
												<span>Deadline</span>
												<h5 className="mb-0 pt-1 font-w500 text-black">Tuesday,Sep 25th 2024</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex project-status align-items-center">
											{item.status}
											<DropdownBlog />
										</div>
									</div>
								</div>
							</div>
						))}	
					</Tab.Pane>
					
					<Tab.Pane eventKey="Progress">
						{projectInfo2.map((item,index)=>(
							<div className="card" key={index}>
								<div className="project-info">
									<div className="col-xl-3 col-xxl-3 my-2 col-lg-4 col-sm-6">
										<p className="text-primary mb-2">{item.id}</p>
										<h4 className="title font-w600 mb-3"><Link to={"/post-details"} className="text-black">{item.title1}</Link></h4>
										<div className="text-dark"><i className="fa fa-calendar-o me-3" />Created on June 6th, 2024</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image1} alt="" />
											</div>
											<div className="ms-3">
												<span>Client</span>
												<h5 className="mb-0 pt-1 fs-18 font-w50 text-black">{item.title2}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image2} alt="" />
											</div>
											<div className="ms-3">
												<span>Person in charge</span>
												<h5 className="mb-0 pt-1 fs-18 font-w500 text-black">{item.title3}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-3 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="power-ic">
												<i className="fa fa-bolt" />
											</div>
											<div className="ms-3">
												<span>Deadline</span>
												<h5 className="mb-0 pt-1 font-w500 text-black">Monday,Sep 24th 2024</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex project-status align-items-center">
											{item.status}
											<DropdownBlog />
										</div>
									</div>
								</div>
							</div>
						))}
					</Tab.Pane>
					<Tab.Pane eventKey="Pending">	
						{projectInfo3.map((item,index)=>(
							<div className="card" key={index}>
								<div className="project-info">
									<div className="col-xl-3 col-xxl-3 my-2 col-lg-4 col-sm-6">
										<p className="text-primary mb-2">{item.id}</p>
										<h4 className="title font-w600 mb-3"><Link to={"/post-details"} className="text-black">{item.title1}</Link></h4>
										<div className="text-dark"><i className="fa fa-calendar-o me-3" />Created on June 6th, 2024</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image1} alt="" />
											</div>
											<div className="ms-3">
												<span>Client</span>
												<h5 className="mb-0 pt-1 fs-18 font-w50 text-black">{item.title2}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image2} alt="" />
											</div>
											<div className="ms-3">
												<span>Person in charge</span>
												<h5 className="mb-0 pt-1 fs-18 font-w500 text-black">{item.title3}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-3 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="power-ic">
												<i className="fa fa-bolt"/>
											</div>
											<div className="ms-3">
												<span>Deadline</span>
												<h5 className="mb-0 pt-1 font-w500 text-black">Friday,June 28th 2024</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex project-status align-items-center">
											{item.status}
											<DropdownBlog />
										</div>
									</div>
								</div>
							</div>
						))}
					</Tab.Pane>
					<Tab.Pane eventKey="Closed">
						{projectInfo4.map((item,index)=>(
							<div className="card" key={index}>
								<div className="project-info">
									<div className="col-xl-3 col-xxl-3 my-2 col-lg-4 col-sm-6">
										<p className="text-primary mb-2">{item.id}</p>
										<h4 className="title font-w600 mb-3"><Link to={"/post-details"} className="text-black">{item.title1}</Link></h4>
										<div className="text-dark"><i className="fa fa-calendar-o me-3" />Created on June 6th, 2024</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image1} alt="" />
											</div>
											<div className="ms-3">
												<span>Client</span>
												<h5 className="mb-0 pt-1 fs-18 font-w50 text-black">{item.title2}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-4 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="project-media">
												<img src={item.image2} alt="" />
											</div>
											<div className="ms-3">
												<span>Person in charge</span>
												<h5 className="mb-0 pt-1 fs-18 font-w500 text-black">{item.title3}</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-3 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex align-items-center">
											<div className="power-ic">
												<i className="fa fa-bolt" />
											</div>
											<div className="ms-3">
												<span>Deadline</span>
												<h5 className="mb-0 pt-1 font-w500 text-black">Friday,june 28th 2024</h5>
											</div>
										</div>
									</div>
									<div className="col-xl-2 my-2 col-xxl-3 col-lg-6 col-sm-6">
										<div className="d-flex project-status align-items-center">
											{item.status}
											<DropdownBlog />
										</div>
									</div>
								</div>
							</div>
						))}
					</Tab.Pane>
				</Tab.Content>						
			</Tab.Container>	
		</Fragment>
	)
}
export default ProjectListTab;