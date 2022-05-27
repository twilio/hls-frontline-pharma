import { createRef, useCallback, useState } from "react";

const Content = () => {
  const [seeding, setSeeding] = useState(false);
  const seedBtnRef = createRef(null);

  //TODO: Make this an action
  const resetAndSeed = useCallback(async (e) => {
    e.preventDefault();
    setSeeding(true);
    await fetch(`https://${process.env.REACT_APP_BACKEND}/seeding/reset`, {
      method: "POST",
    }).then(() =>
      fetch(`https://${process.env.REACT_APP_BACKEND}/seeding/seed`, {
        method: "POST",
      }).then((resp) => setSeeding(false))
    );
  }, []);

  return (
    <>
      <form>
        <div>
          {seeding && (
            <p>
              <strong>Seeding data...</strong>
            </p>
          )}
          <p>Reset Salesforce account and seed data.</p>
        </div>
        <button
          id="btn-authenticate"
          class="button"
          onClick={resetAndSeed}
          ref={seedBtnRef}
        >
          Seed Data
        </button>
      </form>
    </>
  );
};

export default Content;
