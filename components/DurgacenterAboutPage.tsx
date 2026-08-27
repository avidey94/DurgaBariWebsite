const inaugurationImage = "https://thedurgacenter.org/wp-content/uploads/2026/03/maa-durga-inauguration-768x1024.jpg";

export function DurgacenterAboutPage() {
  return (
    <article className="durgacenter-about-page">
      <h1>About</h1>
      <div className="durgacenter-about-content">
        <p className="durgacenter-about-lead"><strong>Durga Bari – Center for Spiritual and Cultural Excellence is a community-led sacred space dedicated to Maa Durga, where devotion, culture, and community come together as one.</strong></p>
        <img className="durgacenter-about-image" src={inaugurationImage} alt="Maa Durga inauguration" />
        <p>Durga Bari is envisioned as more than just a temple—it is a home for prayer, worship, and spiritual growth, while also serving as a vibrant hub for cultural programs, youth education, and community gatherings.</p>
        <p>Our mission is simple yet profound:</p>
        <p>• To create a place of worship free from politics, ego, and division<br />• To preserve and celebrate our rich traditions, festivals, and heritage<br />• To unite the community as one family under the blessings of Maa Durga</p>
        <p><strong>Durga Bari has now entered its Initiation Phase</strong>, marked by our inaugural worship and the establishment of a living sacred space for the community. As we continue to grow, we are building the foundation—spiritually and organizationally—toward our long-term vision of a permanent temple and cultural center for generations to come.</p>
        <p>✨ <em>We invite you to be part of this sacred journey—as volunteers, devotees, and well-wishers—as Durga Bari continues to unfold and grow under Maa Durga’s blessings.</em></p>
      </div>
    </article>
  );
}
