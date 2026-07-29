const statusLabels = {
  in_progress: 'En progreso',
  completed: 'Completada',
  claimed: 'Reclamada',
}

function RewardLine({ reward }) {
  return (
    <div className="quest-rewards">
      {reward.gold > 0 && <span>◆ {reward.gold} oro</span>}
      {reward.experience > 0 && <span>✦ {reward.experience} EXP</span>}
      {reward.item && (
        <span>
          ◇ {reward.item.name} ×{reward.item.quantity}
        </span>
      )}
    </div>
  )
}

export default function QuestPanel({ quests, onClaim, claimingQuestId }) {
  const completedCount = quests.filter((quest) => quest.claimed).length

  return (
    <section className="quest-panel panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">Diario del aventurero</span>
          <h2>Misiones</h2>
        </div>
        <span className="quest-count">
          {completedCount}/{quests.length}
        </span>
      </div>

      <div className="quest-list">
        {quests.map((quest) => {
          const percentage = Math.min(
            100,
            (quest.progress / quest.requiredAmount) * 100,
          )
          const isClaiming = claimingQuestId === quest.id

          return (
            <article
              className={`quest-card quest-${quest.status} ${quest.isMainQuest ? 'main-quest' : ''}`}
              key={quest.id}
            >
              <div className="quest-card__header">
                <span>{quest.isMainQuest ? 'Misión principal' : 'Objetivo de zona'}</span>
                <b>{statusLabels[quest.status]}</b>
              </div>
              <strong>{quest.title}</strong>
              <p>{quest.description}</p>

              <div className="quest-progress-copy">
                <span>Progreso</span>
                <b>{quest.progress}/{quest.requiredAmount}</b>
              </div>
              <div className="quest-progress-track">
                <span style={{ width: `${percentage}%` }} />
              </div>

              <RewardLine reward={quest.reward} />

              {quest.completed && !quest.claimed && (
                <button
                  type="button"
                  onClick={() => onClaim(quest.id)}
                  disabled={isClaiming}
                >
                  {isClaiming ? 'Entregando...' : 'Reclamar recompensa'}
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
