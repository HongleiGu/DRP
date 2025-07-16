export function LumiAvatar(param: { avatarId: string | number }) {
    const avatarId = (typeof param.avatarId === "number") ? param.avatarId : Number.parseInt(param.avatarId)
    return (
      <div
        style={{
          width: 48, // 16 * 2
          height: 60, // 20 * 2
          overflow: "hidden",
          display: "inline-block",
          paddingTop: "4px",
        }}
      >
        <img
          src={`/game/assets/character-pack-full_version/sprite_split/character_${
            avatarId + 1
          }/character_${avatarId + 1}_frame16x20.png`}
          alt="sprite-frame"
          draggable={false}
          style={{
            display: "block",
            objectFit: "none",
            objectPosition: "-16px 6px",
            transform: "scale(3)",
            transformOrigin: "top left",
            imageRendering: "pixelated",
          }}
        />
      </div>
    );
  }