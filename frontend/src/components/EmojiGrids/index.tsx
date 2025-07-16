"use client"
import { ALL_EMOJIS } from "@/utils/utils";
import { Button } from "antd";
import { useMemo } from "react";

// Emoji component
interface EmojiProps {
  emoji: string;
  onSend: (emoji: string) => void;
}

const Emoji = ({ emoji, onSend }: EmojiProps) => (
  <Button 
    className="cursor-pointer text-xl hover:scale-125 transition-transform"
    onClick={() => onSend(emoji)}
  >
    {emoji}
  </Button>
);

// Emoji grid component
interface EmojiGridProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiGrid({ onSelect }: EmojiGridProps) {
  const categories = useMemo(() => ALL_EMOJIS, []);

  return (
    <div className="bg-white rounded shadow-lg p-3" style={{ width: 300, maxHeight: 300, overflowY: 'auto' }}>
      {categories.map((category, index) => (
        <div key={index} className="mb-4">
          <h4 className="font-semibold mb-2">{category.name}</h4>
          <div className="grid grid-cols-6 gap-2">
            {category.emojis.map((emoji, idx) => (
              // eslint-disable-next-line react/jsx-key
              <Emoji key={idx} emoji={emoji} onSend={onSelect} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
