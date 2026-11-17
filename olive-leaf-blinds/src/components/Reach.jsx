export default function Reach() {
  return (
    <>
      <section className="sec" id="reach">
        <div className="wrap">
          <div className="reach-grid">
            <div className="rv">
              <span className="eyebrow">Nationwide service</span>
              <h2 className="h2">Coast to coast, <em>window</em> by window.</h2>
              <p className="lead">Made in our workshop and installed in your home, wherever you live in the USA.</p>
              <div className="pills"><span><i></i>Home measure</span><span><i></i>Custom made</span><span><i></i>Pro installation</span></div>
              <a className="btn gold" href="#contact">Check availability</a>
            </div>
            <div className="map rv" aria-hidden="true">
              <div className="dots"></div>
              <span className="pin" style={{ left: '12%', top: '34%' }}></span>
              <span className="pin" style={{ left: '24%', top: '58%', animationDelay: '-1s' }}></span>
              <span className="pin" style={{ left: '46%', top: '44%' }}></span>
              <span className="pin" style={{ left: '60%', top: '70%' }}></span>
              <span className="pin" style={{ left: '80%', top: '30%' }}></span>
              <span className="pin" style={{ left: '78%', top: '62%' }}></span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
