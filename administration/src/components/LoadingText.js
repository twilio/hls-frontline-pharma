const LoadingText = ({fetchSelector, name}) => {
  const { fetching, fetchingSuccess, fetchingFailure } = fetchSelector;
  return (
    <div>
      {fetching && <span>Fetching {name}...</span>}
      {fetchingSuccess && <span>SUCCESS</span>}
      {fetchingFailure && <span>Could not fetch {name}.</span>}
    </div>
  );
};

export default LoadingText;
