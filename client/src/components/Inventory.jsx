export default function Inventory({ items }) {
  return (
    <aside className="inventory panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Mochila</span>
          <h2>Inventario</h2>
        </div>
        <span className="item-count">{items.length}/20</span>
      </div>

      <div className="inventory-list">
        {items.map((item, index) => (
          <div className="inventory-item" key={item.id}>
            <span className={`item-icon item-icon--${index % 3}`}>
              {item.name.charAt(0)}
            </span>
            <div>
              <strong>{item.name}</strong>
              <span>{item.type.toLowerCase()}</span>
            </div>
            <b>×{item.quantity}</b>
          </div>
        ))}
      </div>
    </aside>
  )
}
