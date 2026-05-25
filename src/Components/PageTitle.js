import { NavLink } from 'react-router-dom';

const PageTitle = (props) => {
    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                    <h4 className="mb-sm-0">{props.title}</h4>
                    <div className="page-title-right">
                        <ol className="breadcrumb m-0">
                            <li className="breadcrumb-item">
                                <NavLink to="/">{props.primary}</NavLink>
                            </li>
                            <li className="breadcrumb-item active">{props.title}</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PageTitle;
