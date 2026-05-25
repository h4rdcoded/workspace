const TableRows = (props) => {
    return (
        Array.from({ length: props.rows }, (_, i) => (
          <tr key={i} className="shimmer">
            <td colSpan={props.colSpan} ><span style={{visibility: 'hidden'}}>test</span></td>
          </tr>
        ))
      );
      
}

const NoRecords = (props) => {
  return (

    <div className="noresult" style={{display: 'block', width: '100%'}}>
      <div className="text-center">
        <lord-icon src="https://cdn.lordicon.com/msoeawqm.json" trigger="loop" colors="primary:#121331,secondary:#08a88a" style={{width: '75px', height: '75px'}} />
        <h5 className="mt-2">Sorry! No Result Found</h5>
      </div>
    </div>
  );
}
export {TableRows, NoRecords};