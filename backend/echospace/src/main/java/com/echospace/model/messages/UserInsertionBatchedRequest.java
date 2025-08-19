package com.echospace.model.messages;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class UserInsertionBatchedRequest {
  private List<String> userIds;
  private String roomId;
}
